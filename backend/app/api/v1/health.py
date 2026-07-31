from fastapi import APIRouter

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
