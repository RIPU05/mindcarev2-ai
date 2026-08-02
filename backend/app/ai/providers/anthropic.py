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


class AnthropicProvider(AIProvider):
    name = "claude"

    def __init__(self) -> None:
        self.model = settings.anthropic_model
        self.api_key = settings.anthropic_api_key
        self.retry_policy = RetryPolicy(
            max_retries=max(settings.ai_max_retries, 0),
            timeout_seconds=settings.ai_timeout,
        )
        self.base_url = "https://api.anthropic.com/v1"

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
            "Claude audio analysis is not enabled yet.",
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
            "max_tokens": 1024,
            "temperature": 0.3,
            "system": "Return only a valid JSON object. Do not include markdown.",
            "messages": [{"role": "user", "content": prompt}],
        }
        client = JsonHttpAIClient(
            provider=self.name,
            model=self.model,
            retry_policy=self.retry_policy,
            missing_config_message=(
                None if self.api_key else "ANTHROPIC_API_KEY is not configured."
            ),
        )
        return await client.post_json(
            url=f"{self.base_url}/messages",
            headers={
                "x-api-key": str(self.api_key),
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            },
            payload=payload,
            extract_text=self._extract_text,
            extract_usage=self._extract_usage,
            extract_request_id=self._extract_request_id,
        )

    def _extract_text(self, raw: dict[str, Any]) -> str:
        parts = raw.get("content") or []
        text = "".join(part.get("text", "") for part in parts if part.get("type") == "text").strip()
        if not text:
            raise AIProviderError("Claude response did not include text content.")
        return text

    def _extract_usage(self, raw: dict[str, Any]) -> TokenUsage:
        usage = raw.get("usage") or {}
        input_tokens = usage.get("input_tokens")
        output_tokens = usage.get("output_tokens")
        total_tokens = (
            input_tokens + output_tokens
            if input_tokens is not None and output_tokens is not None
            else None
        )
        return TokenUsage(
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_tokens=total_tokens,
        )

    def _extract_request_id(
        self, response: httpx.Response, raw: dict[str, Any], fallback: str
    ) -> str:
        return response.headers.get("request-id") or str(raw.get("id") or fallback)
