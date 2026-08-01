from fastapi import APIRouter

from app.ai import get_ai_provider
from app.core.config import settings
from app.schemas.common import ErrorResponse
from app.schemas.health import HealthResponse

router = APIRouter(tags=["health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=200,
    responses={500: {"model": ErrorResponse}},
)
async def health_check() -> HealthResponse:
    return HealthResponse(status="healthy", version=settings.app_version)


@router.get("/health/ai", status_code=200, responses={500: {"model": ErrorResponse}})
async def ai_health_check() -> dict:
    result = await get_ai_provider().health()
    return {
        "status": "healthy" if result.healthy else "unhealthy",
        "provider": result.provider,
        "model": result.model,
        "latency_ms": result.latency_ms,
        "error": result.error,
    }
