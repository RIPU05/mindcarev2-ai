import time
from typing import Any

from app.ai.exceptions import AIProviderError, RateLimitError, TimeoutError
from app.ai.prompts import HEALTH_PROMPT, TEXT_ANALYSIS_PROMPT, journal_prompt, reflection_prompt, summary_prompt
from app.ai.providers.http import JsonHttpAIClient
from app.ai.providers.base import AIProvider
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

    async def generate_reflection(self, text: str, *, context: dict[str, Any] | None = None) -> AIResponse:
        return await self._generate(reflection_prompt(text, context))

    async def summarize(self, text: str, *, context: dict[str, Any] | None = None) -> AIResponse:
        return await self._generate(summary_prompt(text, context))

    async def analyze_audio(self, audio_reference: str, *, context: dict[str, Any] | None = None) -> AIResponse:
        raise AIProviderError(
            "Gemini audio analysis is not enabled yet.",
            details={"audio_reference": audio_reference, "context": context or {}},
        )

    async def health(self) -> ProviderHealthCheck:
        started = time.perf_counter()
        try:
            await self._generate(HEALTH_PROMPT)
            latency_ms = int((time.perf_counter() - started) * 1000)
            return ProviderHealthCheck(provider=self.name, model=self.model, healthy=True, latency_ms=latency_ms)
        except Exception as exc:
            latency_ms = int((time.perf_counter() - started) * 1000)
            return ProviderHealthCheck(
                provider=self.name,
                model=self.model,
                healthy=False,
                latency_ms=latency_ms,
                error=str(exc),
            )

    async def _generate(self, prompt: str) -> AIResponse:
        url = f"{self.base_url}/models/{self.model}:generateContent"
        params = {"key": self.api_key}
        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.3, "responseMimeType": "application/json"},
        }
        client = JsonHttpAIClient(
            provider=self.name,
            model=self.model,
            retry_policy=self.retry_policy,
            missing_config_message=None if self.api_key else "GEMINI_API_KEY is not configured.",
        )
        return await client.post_json(
            url=url,
            params=params,
            payload=payload,
            extract_text=self._extract_text,
            extract_usage=self._extract_usage,
        )

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
