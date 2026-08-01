import time
from typing import Any

from app.ai.exceptions import AIProviderError
from app.ai.prompts import HEALTH_PROMPT, TEXT_ANALYSIS_PROMPT, journal_prompt, reflection_prompt, summary_prompt
from app.ai.providers.base import AIProvider
from app.ai.providers.http import JsonHttpAIClient
from app.ai.types import AIResponse, ProviderHealthCheck, RetryPolicy, TokenUsage
from app.core.config import settings


class OllamaProvider(AIProvider):
    name = "ollama"

    def __init__(self) -> None:
        self.model = settings.ollama_model
        self.base_url = settings.ollama_base_url.rstrip("/")
        self.retry_policy = RetryPolicy(max_retries=max(settings.ai_max_retries, 0), timeout_seconds=settings.ai_timeout)

    async def analyze_text(self, text: str, *, system_prompt: str | None = None) -> AIResponse:
        return await self._generate(journal_prompt(system_prompt or TEXT_ANALYSIS_PROMPT, text))

    async def generate_reflection(self, text: str, *, context: dict[str, Any] | None = None) -> AIResponse:
        return await self._generate(reflection_prompt(text, context))

    async def summarize(self, text: str, *, context: dict[str, Any] | None = None) -> AIResponse:
        return await self._generate(summary_prompt(text, context))

    async def analyze_audio(self, audio_reference: str, *, context: dict[str, Any] | None = None) -> AIResponse:
        raise AIProviderError("Ollama audio analysis is not enabled yet.", details={"audio_reference": audio_reference, "context": context or {}})

    async def health(self) -> ProviderHealthCheck:
        started = time.perf_counter()
        try:
            await self._generate(HEALTH_PROMPT)
            return ProviderHealthCheck(provider=self.name, model=self.model, healthy=True, latency_ms=int((time.perf_counter() - started) * 1000))
        except Exception as exc:
            return ProviderHealthCheck(provider=self.name, model=self.model, healthy=False, latency_ms=int((time.perf_counter() - started) * 1000), error=str(exc))

    async def _generate(self, prompt: str) -> AIResponse:
        payload = {
            "model": self.model,
            "stream": False,
            "format": "json",
            "messages": [
                {"role": "system", "content": "Return only a valid JSON object. Do not include markdown."},
                {"role": "user", "content": prompt},
            ],
        }
        client = JsonHttpAIClient(provider=self.name, model=self.model, retry_policy=self.retry_policy)
        return await client.post_json(
            url=f"{self.base_url}/api/chat",
            payload=payload,
            extract_text=self._extract_text,
            extract_usage=self._extract_usage,
            extract_request_id=lambda _response, raw, fallback: str(raw.get("created_at") or fallback),
        )

    def _extract_text(self, raw: dict[str, Any]) -> str:
        content = raw.get("message", {}).get("content", "").strip()
        if not content:
            raise AIProviderError("Ollama response did not include text content.")
        return content

    def _extract_usage(self, raw: dict[str, Any]) -> TokenUsage:
        input_tokens = raw.get("prompt_eval_count")
        output_tokens = raw.get("eval_count")
        total_tokens = input_tokens + output_tokens if input_tokens is not None and output_tokens is not None else None
        return TokenUsage(input_tokens=input_tokens, output_tokens=output_tokens, total_tokens=total_tokens)
