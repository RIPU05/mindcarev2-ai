import time
from typing import Any

from app.ai.exceptions import AIProviderError
from app.ai.prompts import (
    HEALTH_PROMPT,
    TEXT_ANALYSIS_PROMPT,
    journal_prompt,
    reflection_prompt,
    summary_prompt,
)
from app.ai.providers.base import AIProvider
from app.ai.providers.http import JsonHttpAIClient
from app.ai.types import AIResponse, ProviderHealthCheck, RetryPolicy, TokenUsage
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class GeminiProvider(AIProvider):
    name = "gemini"

    def __init__(self) -> None:
        self.model = settings.gemini_model
        self.api_key = settings.gemini_api_key
        self.retry_policy = RetryPolicy(
            max_retries=max(settings.ai_max_retries, 0),
            timeout_seconds=settings.ai_timeout,
        )
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"

    async def analyze_text(self, text: str, *, system_prompt: str | None = None) -> AIResponse:
        return await self._generate(journal_prompt(system_prompt or TEXT_ANALYSIS_PROMPT, text))

    async def generate_reflection(
        self, text: str, *, context: dict[str, Any] | None = None
    ) -> AIResponse:
        return await self._generate(reflection_prompt(text, context))

    async def summarize(self, text: str, *, context: dict[str, Any] | None = None) -> AIResponse:
        return await self._generate(summary_prompt(text, context))

    async def analyze_audio(
        self, audio_reference: str, *, context: dict[str, Any] | None = None
    ) -> AIResponse:
        raise AIProviderError(
            "Gemini audio analysis is not enabled yet.",
            details={"audio_reference": audio_reference, "context": context or {}},
        )

    async def health(self) -> ProviderHealthCheck:
        started = time.perf_counter()
        try:
            await self._generate(HEALTH_PROMPT)
            latency_ms = int((time.perf_counter() - started) * 1000)
            return ProviderHealthCheck(
                provider=self.name,
                model=self.model,
                healthy=True,
                latency_ms=latency_ms,
            )
        except Exception as exc:
            latency_ms = int((time.perf_counter() - started) * 1000)
            available_models: list[str] = []
            if self.api_key:
                try:
                    import httpx

                    async with httpx.AsyncClient(timeout=10.0) as client:
                        resp = await client.get(
                            f"{self.base_url}/models", params={"key": self.api_key}
                        )
                        if resp.status_code == 200:
                            models_data = resp.json().get("models") or []
                            for m in models_data:
                                name = m.get("name", "")
                                methods = m.get("supportedGenerationMethods") or []
                                if "generateContent" in methods:
                                    available_models.append(name.replace("models/", ""))
                except Exception:
                    pass

            err_msg = str(exc)
            if self.api_key:
                try:
                    import httpx

                    async with httpx.AsyncClient(timeout=10.0) as client:
                        resp = await client.get(
                            f"{self.base_url}/models", params={"key": self.api_key}
                        )
                        if resp.status_code == 200:
                            models_data = resp.json().get("models") or []
                            for m in models_data:
                                name = m.get("name", "")
                                methods = m.get("supportedGenerationMethods") or []
                                if "generateContent" in methods:
                                    available_models.append(name.replace("models/", ""))
                            if available_models:
                                err_msg += f" (Available generateContent models: {', '.join(available_models[:10])})"
                            else:
                                err_msg += " (ListModels returned 200 OK but 0 generateContent models found)"
                        else:
                            err_msg += f" (ListModels status: {resp.status_code})"
                except Exception as list_exc:
                    err_msg += f" (ListModels exception: {list_exc})"

            return ProviderHealthCheck(
                provider=self.name,
                model=self.model,
                healthy=False,
                latency_ms=latency_ms,
                error=err_msg,
            )

    async def _generate(self, prompt: str) -> AIResponse:
        from app.ai.limiter import bound_prompt_tokens, gemini_limiter

        bounded_prompt = bound_prompt_tokens(prompt)

        candidate_models = []
        primary_model = "gemini-2.5-flash" if self.model == "gemini-1.5-flash" else self.model
        candidate_models.append(primary_model)
        for fallback_m in ["gemini-flash-latest", "gemini-2.5-flash-lite", "gemini-1.5-flash"]:
            if fallback_m not in candidate_models:
                candidate_models.append(fallback_m)

        last_err: Exception | None = None
        for model_to_use in candidate_models:
            await gemini_limiter.acquire()
            try:
                url = f"{self.base_url}/models/{model_to_use}:generateContent"
                params = {"key": self.api_key}
                payload = {
                    "contents": [{"role": "user", "parts": [{"text": bounded_prompt}]}],
                    "generationConfig": {
                        "temperature": 0.3,
                        "responseMimeType": "application/json",
                        "maxOutputTokens": settings.gemini_max_output_tokens,
                    },
                }
                client = JsonHttpAIClient(
                    provider=self.name,
                    model=model_to_use,
                    retry_policy=self.retry_policy,
                    missing_config_message=(None if self.api_key else "GEMINI_API_KEY is not configured."),
                )
                try:
                    return await client.post_json(
                        url=url,
                        params=params,
                        payload=payload,
                        extract_text=self._extract_text,
                        extract_usage=self._extract_usage,
                    )
                except Exception as exc:
                    last_err = exc
                    err_str = str(exc).lower()
                    if "429" in err_str or "rate limit" in err_str or "404" in err_str or "not found" in err_str:
                        logger.warning(
                            f"Gemini model '{model_to_use}' failed with rate limit or not found. Retrying with next candidate model."
                        )
                        continue
                    raise
            finally:
                gemini_limiter.release()

        if isinstance(last_err, AIProviderError):
            raise last_err
        raise AIProviderError(f"All Gemini candidate models failed. Last error: {last_err}") from last_err

    def _extract_text(self, raw: dict[str, Any]) -> str:
        candidates = raw.get("candidates") or []
        if not candidates:
            raise AIProviderError("Gemini response did not include candidates.")
        parts = candidates[0].get("content", {}).get("parts") or []
        text = "".join(part.get("text", "") for part in parts).strip()
        if not text:
            raise AIProviderError("Gemini response did not include text content.")
        return text

    def _extract_usage(self, raw: dict[str, Any]) -> TokenUsage:
        usage = raw.get("usageMetadata") or {}
        return TokenUsage(
            input_tokens=usage.get("promptTokenCount"),
            output_tokens=usage.get("candidatesTokenCount"),
            total_tokens=usage.get("totalTokenCount"),
        )
