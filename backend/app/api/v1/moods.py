from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.auth.dependencies import get_current_user
from app.db.uow import UnitOfWork
from app.exceptions import NotFoundException
from app.models.analysis import MoodAnalysis
from app.models.users import User
from app.repositories.analysis import MoodAnalysisRepository
from app.schemas.common import ErrorResponse
from app.schemas.enums import AnalysisInputType, AnalysisStatus, RiskLevel
from app.schemas.mood import MoodHistoryListResponse, MoodHistoryResponse
from app.utils.pagination import PaginationParams

router = APIRouter(prefix="/moods", tags=["moods"], dependencies=[Depends(get_current_user)])

ERROR_RESPONSES = {
    401: {"model": ErrorResponse},
    404: {"model": ErrorResponse},
    422: {"model": ErrorResponse},
    500: {"model": ErrorResponse},
}


@router.get("", response_model=MoodHistoryListResponse, status_code=200, responses=ERROR_RESPONSES)
async def list_moods(
    current_user: User = Depends(get_current_user),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    sort_by: str = Query(default="created_at", min_length=1, max_length=80),
    sort_direction: str = Query(default="desc", pattern="^(asc|desc)$"),
    source: AnalysisInputType | None = None,
    status: AnalysisStatus | None = None,
    risk_level: RiskLevel | None = None,
    include_deleted: bool = False,
) -> MoodHistoryListResponse:
    async with UnitOfWork() as uow:
        repository = MoodAnalysisRepository(uow.session)
        items = await repository.list_for_user(
            current_user.id,
            pagination=PaginationParams(
                limit=limit,
                offset=offset,
                sort_by=sort_by,
                sort_direction=sort_direction,
            ),
            include_deleted=include_deleted,
            input_type=source,
            status=status,
            risk_level=risk_level,
        )
        total = await repository.count_for_user(
            current_user.id,
            include_deleted=include_deleted,
            input_type=source,
            status=status,
            risk_level=risk_level,
        )
        return MoodHistoryListResponse(items=[mood_response(item) for item in items], total=total)


@router.get("/{id}", response_model=MoodHistoryResponse, status_code=200, responses=ERROR_RESPONSES)
async def get_mood(
    id: UUID,
    current_user: User = Depends(get_current_user),
    include_deleted: bool = False,
) -> MoodHistoryResponse:
    async with UnitOfWork() as uow:
        analysis = await MoodAnalysisRepository(uow.session).get_for_user(
            current_user.id,
            id,
            include_deleted=include_deleted,
        )
        if analysis is None:
            raise NotFoundException("Mood analysis was not found.")
        return mood_response(analysis)


def mood_response(analysis: MoodAnalysis) -> MoodHistoryResponse:
    return MoodHistoryResponse(
        id=analysis.id,
        primary_mood=analysis.primary_mood or "unknown",
        confidence=analysis.confidence or 0.0,
        source=analysis.input_type,
        created_at=analysis.created_at,
    )
