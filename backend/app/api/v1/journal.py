from uuid import UUID

from fastapi import APIRouter

from app.schemas.common import ErrorResponse
from app.schemas.journal import (
    JournalCreateRequest,
    JournalListResponse,
    JournalResponse,
    JournalUpdateRequest,
)

router = APIRouter(prefix="/journal", tags=["journal"])

ERROR_RESPONSES = {
    400: {"model": ErrorResponse},
    401: {"model": ErrorResponse},
    404: {"model": ErrorResponse},
    422: {"model": ErrorResponse},
    500: {"model": ErrorResponse},
}


@router.post("", response_model=JournalResponse, status_code=201, responses=ERROR_RESPONSES)
async def create_journal_entry(payload: JournalCreateRequest) -> JournalResponse:
    return JournalResponse.mock()


@router.get("", response_model=JournalListResponse, status_code=200, responses=ERROR_RESPONSES)
async def list_journal_entries() -> JournalListResponse:
    return JournalListResponse(items=[JournalResponse.mock()], total=1)


@router.get("/{id}", response_model=JournalResponse, status_code=200, responses=ERROR_RESPONSES)
async def get_journal_entry(id: UUID) -> JournalResponse:
    return JournalResponse.mock(id=id)


@router.patch("/{id}", response_model=JournalResponse, status_code=200, responses=ERROR_RESPONSES)
async def update_journal_entry(id: UUID, payload: JournalUpdateRequest) -> JournalResponse:
    return JournalResponse.mock(id=id)


@router.delete("/{id}", status_code=204, responses=ERROR_RESPONSES)
async def delete_journal_entry(id: UUID) -> None:
    return None
