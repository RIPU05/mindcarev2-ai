import time
from collections import defaultdict

from fastapi import HTTPException, Request


class AuthRateLimiter:
    def __init__(self, requests_limit: int = 5, window_seconds: int = 60) -> None:
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        self.history: dict[str, list[float]] = defaultdict(list)

    async def __call__(self, request: Request) -> None:
        ip = request.client.host if request.client else "unknown"
        now = time.time()
        timestamps = self.history[ip]
        # Purge expired timestamps
        timestamps = [t for t in timestamps if now - t < self.window_seconds]
        self.history[ip] = timestamps

        if len(timestamps) >= self.requests_limit:
            raise HTTPException(
                status_code=429,
                detail="Too many authentication attempts. Please try again later.",
            )
        self.history[ip].append(now)


auth_rate_limiter = AuthRateLimiter()
