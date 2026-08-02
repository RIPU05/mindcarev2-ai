import asyncio
import time
from collections.abc import Callable
from typing import Any
from uuid import uuid4

import httpx

from app.ai.exceptions import AIProviderError, RateLimitError, TimeoutError
from app.ai.types import AIResponse, RetryPolicy, TokenUsage
from app.core.logging import get_logger

logger = get_logger(__name__)

ExtractText = Callable[[dict[str, Any]], str]
ExtractUsage = Callable[[dict[str, Any]], TokenUsage]
ExtractRequestId = Callable[[httpx.Response, dict[str, Any], str], str]


class JsonHttpAIClient:
    def __init__(
        self,
        *,
        provider: str,
        model: str,
        retry_policy: RetryPolicy,
        missing_config_message: str | None = None,
    ) -> None:
        self.provider = provider
        self.model = model
        self.retry_policy = retry_policy
        self.missing_config_message = missing_config_message

    async def post_json(
        self,
        *,
        url: str,
        payload: dict[str, Any],
        headers: dict[str, str] | None = None,
        params: dict[str, Any] | None = None,
        extract_text: ExtractText,
        extract_usage: ExtractUsage,
        extract_request_id: ExtractRequestId | None = None,
    ) -> AIResponse:
        if self.missing_config_message:
            raise AIProviderError(self.missing_config_message)

        local_request_id = str(uuid4())
        started = time.perf_counter()
        last_error: Exception | None = None

        for attempt in range(self.retry_policy.max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self.retry_policy.timeout_seconds) as client:
                    response = await client.post(url, params=params, headers=headers, json=payload)
                if response.status_code == 429:
                    raise RateLimitError(
                        f"{self.provider} rate limit exceeded.",
                        details={"request_id": local_request_id},
                    )
                if response.status_code in self.retry_policy.retryable_status_codes:
                    raise AIProviderError(
                        f"{self.provider} returned a retryable error.",
                        details={
                            "status_code": response.status_code,
                            "request_id": local_request_id,
                        },
                    )
                response.raise_for_status()
                raw = response.json()
                latency_ms = int((time.perf_counter() - started) * 1000)
                request_id = (
                    extract_request_id(response, raw, local_request_id)
                    if extract_request_id
                    else response.headers.get("x-request-id", local_request_id)
                )
                logger.info(
                    "ai_provider_request_completed",
                    extra={
                        "provider": self.provider,
                        "model": self.model,
                        "latency_ms": latency_ms,
                        "request_id": request_id,
                        "attempt": attempt + 1,
                    },
                )
                return AIResponse(
                    content=extract_text(raw),
                    provider=self.provider,
                    model=self.model,
                    latency_ms=latency_ms,
                    request_id=request_id,
                    token_usage=extract_usage(raw),
                    raw=raw,
                )
            except httpx.TimeoutException as exc:
                last_error = TimeoutError(
                    f"{self.provider} request timed out.", details={"request_id": local_request_id}
                )
            except RateLimitError:
                raise
            except (httpx.HTTPError, AIProviderError) as exc:
                last_error = exc

            logger.warning(
                "ai_provider_request_retry",
                extra={
                    "provider": self.provider,
                    "model": self.model,
                    "request_id": local_request_id,
                    "attempt": attempt + 1,
                    "max_retries": self.retry_policy.max_retries,
                    "error": str(last_error),
                },
            )
            if attempt < self.retry_policy.max_retries:
                await asyncio.sleep(0.3 * (attempt + 1))

        if isinstance(last_error, AIProviderError):
            raise last_error
        raise AIProviderError(
            f"{self.provider} request failed.", details={"request_id": local_request_id}
        ) from last_error
