from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.db.uow import UnitOfWork
from app.models.users import User
from app.repositories.analysis import MoodAnalysisRepository
from app.repositories.journal import JournalRepository
from app.schemas.common import ErrorResponse
from app.schemas.dashboard import DashboardSummaryResponse
from app.schemas.enums import RiskLevel
from app.utils.pagination import PaginationParams

router = APIRouter(prefix="/dashboard", tags=["dashboard"], dependencies=[Depends(get_current_user)])

ERROR_RESPONSES = {
    401: {"model": ErrorResponse},
    500: {"model": ErrorResponse},
}


@router.get(
    "/summary",
    response_model=DashboardSummaryResponse,
    status_code=200,
    responses=ERROR_RESPONSES,
)
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
) -> DashboardSummaryResponse:
    async with UnitOfWork() as uow:
        journals = JournalRepository(uow.session)
        moods = MoodAnalysisRepository(uow.session)
        latest = await moods.list_for_user(
            current_user.id,
            pagination=PaginationParams(limit=1, offset=0, sort_by="created_at", sort_direction="desc"),
        )
        latest_mood = latest[0] if latest else None
        return DashboardSummaryResponse(
            journal_count=await journals.count_for_user(current_user.id),
            mood_count=await moods.count_for_user(current_user.id),
            latest_mood=latest_mood.primary_mood if latest_mood else None,
            risk_level=latest_mood.risk_level if latest_mood else RiskLevel.UNKNOWN,
        )
