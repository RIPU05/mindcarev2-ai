from fastapi import APIRouter

from app.schemas.common import ErrorResponse
from app.schemas.dashboard import DashboardSummaryResponse

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

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
async def get_dashboard_summary() -> DashboardSummaryResponse:
    return DashboardSummaryResponse.mock()
