from fastapi import APIRouter

from app.schemas.common import ErrorResponse
from app.schemas.profile import ProfileResponse, ProfileUpdateRequest

router = APIRouter(prefix="/profile", tags=["profile"])

ERROR_RESPONSES = {
    400: {"model": ErrorResponse},
    401: {"model": ErrorResponse},
    422: {"model": ErrorResponse},
    500: {"model": ErrorResponse},
}


@router.get("", response_model=ProfileResponse, status_code=200, responses=ERROR_RESPONSES)
async def get_profile() -> ProfileResponse:
    return ProfileResponse.mock()


@router.patch("", response_model=ProfileResponse, status_code=200, responses=ERROR_RESPONSES)
async def update_profile(payload: ProfileUpdateRequest) -> ProfileResponse:
    return ProfileResponse.mock()
