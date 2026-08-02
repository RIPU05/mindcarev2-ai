import time
import uuid

from starlette.middleware.gzip import GZipMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.logging import get_logger

logger = get_logger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers.setdefault("x-content-type-options", "nosniff")
        response.headers.setdefault("x-frame-options", "DENY")
        response.headers.setdefault("referrer-policy", "strict-origin-when-cross-origin")
        response.headers.setdefault(
            "permissions-policy", "camera=(), microphone=(), geolocation=()"
        )
        response.headers.setdefault(
            "strict-transport-security", "max-age=63072000; includeSubDomains; preload"
        )
        response.headers.setdefault("x-xss-protection", "1; mode=block")
        return response


class RateLimitPlaceholderMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        return await call_next(request)


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
        request.state.request_id = request_id

        from app.core.metrics import (
            metrics_registry,
            HTTP_REQUESTS_TOTAL,
            HTTP_REQUEST_DURATION_SECONDS,
        )

        start = time.perf_counter()
        try:
            response = await call_next(request)
            duration_seconds = time.perf_counter() - start
            duration_ms = round(duration_seconds * 1000, 2)
        except Exception as exc:
            duration_seconds = time.perf_counter() - start
            duration_ms = round(duration_seconds * 1000, 2)
            metrics_registry.request_count += 1
            metrics_registry.failures += 1
            metrics_registry.total_request_latency += duration_ms

            # Record Prometheus
            HTTP_REQUESTS_TOTAL.labels(
                method=request.method, path=request.url.path, status="500"
            ).inc()
            HTTP_REQUEST_DURATION_SECONDS.labels(
                method=request.method, path=request.url.path
            ).observe(duration_seconds)

            # Get user ID if present
            claims = getattr(request.state, "auth_claims", None) or {}
            user_id = claims.get("sub")

            logger.exception(
                "request_failed",
                extra={
                    "request_id": request_id,
                    "user_id": user_id,
                    "endpoint": request.url.path,
                    "method": request.method,
                    "status_code": 500,
                    "latency_ms": duration_ms,
                    "exception": str(exc),
                },
            )
            raise

        response.headers["x-request-id"] = request_id
        response.headers["x-response-time-ms"] = str(duration_ms)

        metrics_registry.request_count += 1
        metrics_registry.total_request_latency += duration_ms
        if response.status_code >= 400:
            metrics_registry.failures += 1

        # Record Prometheus
        HTTP_REQUESTS_TOTAL.labels(
            method=request.method, path=request.url.path, status=str(response.status_code)
        ).inc()
        HTTP_REQUEST_DURATION_SECONDS.labels(method=request.method, path=request.url.path).observe(
            duration_seconds
        )

        # Get user ID if present
        claims = getattr(request.state, "auth_claims", None) or {}
        user_id = claims.get("sub")

        logger.info(
            "request_completed",
            extra={
                "request_id": request_id,
                "user_id": user_id,
                "endpoint": request.url.path,
                "method": request.method,
                "status_code": response.status_code,
                "latency_ms": duration_ms,
            },
        )
        return response


__all__ = [
    "GZipMiddleware",
    "RateLimitPlaceholderMiddleware",
    "RequestContextMiddleware",
    "SecurityHeadersMiddleware",
    "TrustedHostMiddleware",
]
