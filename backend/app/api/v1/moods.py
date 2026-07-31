from uuid import UUID

from fastapi import APIRouter

from app.schemas.common import ErrorResponse
from app.schemas.mood import MoodHistoryListResponse, MoodHistoryResponse

router = APIRouter(prefix="/moods", tags=["moods"])

ERROR_RESPONSES = {
    401: {"model": ErrorResponse},
    404: {"model": ErrorResponse},
    422: {"model": ErrorResponse},
    500: {"model": ErrorResponse},
}


@router.get("", response_model=MoodHistoryListResponse, status_code=200, responses=ERROR_RESPONSES)
async def list_moods() -> MoodHistoryListResponse:
    return MoodHistoryListResponse(items=[MoodHistoryResponse.mock()], total=1)


@router.get("/{id}", response_model=MoodHistoryResponse, status_code=200, responses=ERROR_RESPONSES)
async def get_mood(id: UUID) -> MoodHistoryResponse:
    return MoodHistoryResponse.mock(id=id)
