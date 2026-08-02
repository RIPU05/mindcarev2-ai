import time
from typing import Any

import httpx

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


class GroqProvider(AIProvider):
    name = "groq"

    def __init__(self) -> None:
        self.model = settings.groq_model
        self.api_key = settings.groq_api_key
        self.retry_policy = RetryPolicy(
            max_retries=max(settings.ai_max_retries, 0),
            timeout_seconds=settings.ai_timeout,
        )
        self.base_url = "https://api.groq.com/openai/v1"

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
            "Groq audio analysis is not enabled yet.",
            details={"audio_reference": audio_reference, "context": context or {}},
        )

    async def health(self) -> ProviderHealthCheck:
        started = time.perf_counter()
        try:
            await self._generate(HEALTH_PROMPT)
            return ProviderHealthCheck(
                provider=self.name,
                model=self.model,
                healthy=True,
                latency_ms=int((time.perf_counter() - started) * 1000),
            )
        except Exception as exc:
            return ProviderHealthCheck(
                provider=self.name,
                model=self.model,
                healthy=False,
                latency_ms=int((time.perf_counter() - started) * 1000),
                error=str(exc),
            )

    async def _generate(self, prompt: str) -> AIResponse:
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.3,
            "response_format": {"type": "json_object"},
        }
        client = JsonHttpAIClient(
            provider=self.name,
            model=self.model,
            retry_policy=self.retry_policy,
            missing_config_message=(None if self.api_key else "GROQ_API_KEY is not configured."),
        )
        return await client.post_json(
            url=f"{self.base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            payload=payload,
            extract_text=self._extract_text,
            extract_usage=self._extract_usage,
            extract_request_id=self._extract_request_id,
        )

    def _extract_text(self, raw: dict[str, Any]) -> str:
        choices = raw.get("choices") or []
        if not choices:
            raise AIProviderError("Groq response did not include choices.")
        content = choices[0].get("message", {}).get("content", "").strip()
        if not content:
            raise AIProviderError("Groq response did not include text content.")
        return content

    def _extract_usage(self, raw: dict[str, Any]) -> TokenUsage:
        usage = raw.get("usage") or {}
        return TokenUsage(
            input_tokens=usage.get("prompt_tokens"),
            output_tokens=usage.get("completion_tokens"),
            total_tokens=usage.get("total_tokens"),
        )

    def _extract_request_id(
        self, response: httpx.Response, raw: dict[str, Any], fallback: str
    ) -> str:
        return response.headers.get("x-request-id") or str(raw.get("id") or fallback)
