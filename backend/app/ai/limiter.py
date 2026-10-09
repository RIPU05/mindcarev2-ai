import asyncio
import time
from typing import Any

from app.ai.exceptions import AIProviderError, RateLimitError
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class GeminiRateLimiter:
    """Project-level rate limiter and queue manager for Gemini API calls."""

    def __init__(self) -> None:
        self._semaphore: asyncio.Semaphore | None = None
        self._last_request_time = 0.0
        self._timestamps: list[float] = []
        self._lock = asyncio.Lock()

    def _get_semaphore(self) -> asyncio.Semaphore:
        if self._semaphore is None:
            self._semaphore = asyncio.Semaphore(settings.gemini_concurrency_limit)
        return self._semaphore

    async def acquire(self) -> None:
        semaphore = self._get_semaphore()
        try:
            await asyncio.wait_for(
                semaphore.acquire(),
                timeout=float(settings.gemini_queue_timeout_seconds),
            )
        except asyncio.TimeoutError:
            logger.warning("Gemini API request queue timeout exceeded.")
            raise RateLimitError(
                "Gemini API request queue is saturated. Please wait a moment before trying again.",
                details={"retry_after": 6},
            )

        async with self._lock:
            now = time.time()
            # Clean timestamps older than 60 seconds
            self._timestamps = [t for t in self._timestamps if now - t < 60.0]

            max_rpm = settings.gemini_max_requests_per_minute
            if len(self._timestamps) >= max_rpm:
                oldest = self._timestamps[0]
                wait_needed = 60.0 - (now - oldest) + 0.1
                if wait_needed > 0:
                    if wait_needed > settings.gemini_queue_timeout_seconds:
                        semaphore.release()
                        raise RateLimitError(
                            "Gemini API rate limit reached. Please wait a moment before trying again.",
                            details={"retry_after": int(wait_needed) + 1},
                        )
                    await asyncio.sleep(wait_needed)
                    now = time.time()
                    self._timestamps = [t for t in self._timestamps if now - t < 60.0]

            min_interval = settings.gemini_min_request_interval_seconds
            elapsed = now - self._last_request_time
            if elapsed < min_interval and self._last_request_time > 0:
                sleep_time = min_interval - elapsed
                await asyncio.sleep(sleep_time)
                now = time.time()

            self._last_request_time = now
            self._timestamps.append(now)

    def release(self) -> None:
        semaphore = self._get_semaphore()
        try:
            semaphore.release()
        except ValueError:
            pass

    def reset(self) -> None:
        """Reset state for tests."""
        self._semaphore = None
        self._last_request_time = 0.0
        self._timestamps.clear()


gemini_limiter = GeminiRateLimiter()


def bound_prompt_tokens(prompt: str, max_input_tokens: int | None = None) -> str:
    """Validate and bound user input prompt before calling Gemini API."""
    max_tokens = max_input_tokens or settings.gemini_max_input_tokens
    # Rough estimation: ~4 chars per token for English text
    max_chars = max_tokens * 4
    if len(prompt) > max_chars:
        logger.info(
            f"Input prompt truncated from {len(prompt)} chars to max allowed limit of {max_chars} chars."
        )
        return prompt[:max_chars] + "\n\n[Note: Input context truncated to comply with maximum token limit.]"
    return prompt


class UserAIRateLimiter:
    """Per-user rate limiter for AI generation endpoints to prevent user burst abuse."""

    def __init__(self, requests_limit: int | None = None, window_seconds: int = 60) -> None:
        from collections import defaultdict

        self.requests_limit = requests_limit or settings.user_ai_max_requests_per_minute
        self.window_seconds = window_seconds
        self.history: dict[str, list[float]] = defaultdict(list)

    async def check(self, user_id: str) -> None:
        now = time.time()
        # Clean up stale user keys if tracking map grows large
        if len(self.history) > 200:
            stale = [uid for uid, ts in self.history.items() if not ts or (now - ts[-1] >= self.window_seconds)]
            for k in stale:
                self.history.pop(k, None)

        timestamps = [t for t in self.history[user_id] if now - t < self.window_seconds]
        self.history[user_id] = timestamps

        if len(timestamps) >= self.requests_limit:
            raise RateLimitError(
                "User AI request rate limit exceeded. Please wait a moment before sending another message.",
                details={"retry_after": 12},
            )
        self.history[user_id].append(now)

    def reset(self) -> None:
        self.history.clear()


user_ai_rate_limiter = UserAIRateLimiter()

