from fastapi import APIRouter

from app.schemas.assistant import AssistantChatRequest, AssistantChatResponse
from app.schemas.common import ErrorResponse

router = APIRouter(prefix="/assistant", tags=["assistant"])

ERROR_RESPONSES = {
    400: {"model": ErrorResponse},
    401: {"model": ErrorResponse},
    422: {"model": ErrorResponse},
    500: {"model": ErrorResponse},
}


@router.post(
    "/chat",
    response_model=AssistantChatResponse,
    status_code=200,
    responses=ERROR_RESPONSES,
)
async def chat(payload: AssistantChatRequest) -> AssistantChatResponse:
    return AssistantChatResponse.mock()
