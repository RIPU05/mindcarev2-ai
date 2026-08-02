from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.auth.dependencies import get_current_user
from app.db.uow import UnitOfWork
from app.exceptions import NotFoundException
from app.models.journal import JournalEntry
from app.models.users import User
from app.repositories.journal import JournalRepository
from app.schemas.common import ErrorResponse
from app.schemas.enums import JournalSource
from app.schemas.journal import (
    JournalCreateRequest,
    JournalListResponse,
    JournalResponse,
    JournalUpdateRequest,
)
from app.utils.pagination import PaginationParams

router = APIRouter(prefix="/journal", tags=["journal"], dependencies=[Depends(get_current_user)])

ERROR_RESPONSES: dict[int | str, dict] = {
    400: {"model": ErrorResponse},
    401: {"model": ErrorResponse},
    404: {"model": ErrorResponse},
    422: {"model": ErrorResponse},
    500: {"model": ErrorResponse},
}


@router.post("", response_model=JournalResponse, status_code=201, responses=ERROR_RESPONSES)
async def create_journal_entry(
    payload: JournalCreateRequest,
    current_user: User = Depends(get_current_user),
) -> JournalResponse:
    async with UnitOfWork() as uow:
        repository = JournalRepository(uow.session)
        entry = await repository.add(
            JournalEntry(
                user_id=current_user.id,
                title=payload.title,
                content=payload.content,
                tags=payload.tags,
                source=payload.source,
            )
        )
        await uow.commit()

        import asyncio

        from app.rag.embeddings import generate_and_store_embedding
        from app.rag.types import RetrievalSource

        asyncio.create_task(
            generate_and_store_embedding(
                text=entry.content,
                source=RetrievalSource.JOURNAL,
                document_id=str(entry.id),
                user_id=entry.user_id,
                metadata={"title": entry.title},
            )
        )

        return journal_response(entry)


@router.get("", response_model=JournalListResponse, status_code=200, responses=ERROR_RESPONSES)
async def list_journal_entries(
    current_user: User = Depends(get_current_user),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    sort_by: str = Query(default="created_at", min_length=1, max_length=80),
    sort_direction: str = Query(default="desc", pattern="^(asc|desc)$"),
    source: JournalSource | None = None,
    search: str | None = Query(default=None, max_length=200),
    include_deleted: bool = False,
) -> JournalListResponse:
    async with UnitOfWork() as uow:
        repository = JournalRepository(uow.session)
        pagination = PaginationParams(
            limit=limit,
            offset=offset,
            sort_by=sort_by,
            sort_direction=sort_direction,
        )
        items = await repository.list_for_user(
            current_user.id,
            pagination=pagination,
            include_deleted=include_deleted,
            source=source,
            search=search,
        )
        total = await repository.count_for_user(
            current_user.id,
            include_deleted=include_deleted,
            source=source,
            search=search,
        )
        return JournalListResponse(items=[journal_response(item) for item in items], total=total)


@router.get("/{id}", response_model=JournalResponse, status_code=200, responses=ERROR_RESPONSES)
async def get_journal_entry(
    id: UUID,
    current_user: User = Depends(get_current_user),
    include_deleted: bool = False,
) -> JournalResponse:
    async with UnitOfWork() as uow:
        entry = await JournalRepository(uow.session).get_for_user(
            current_user.id,
            id,
            include_deleted=include_deleted,
        )
        if entry is None:
            raise NotFoundException("Journal entry was not found.")
        return journal_response(entry)


@router.patch("/{id}", response_model=JournalResponse, status_code=200, responses=ERROR_RESPONSES)
async def update_journal_entry(
    id: UUID,
    payload: JournalUpdateRequest,
    current_user: User = Depends(get_current_user),
) -> JournalResponse:
    async with UnitOfWork() as uow:
        repository = JournalRepository(uow.session)
        entry = await repository.get_for_user(current_user.id, id)
        if entry is None:
            raise NotFoundException("Journal entry was not found.")
        changes = payload.model_dump(exclude_unset=True)
        for field, value in changes.items():
            setattr(entry, field, value)
        entry.version += 1
        await repository.update(entry)
        await uow.commit()

        import asyncio

        from app.rag.embeddings import generate_and_store_embedding
        from app.rag.types import RetrievalSource

        asyncio.create_task(
            generate_and_store_embedding(
                text=entry.content,
                source=RetrievalSource.JOURNAL,
                document_id=str(entry.id),
                user_id=entry.user_id,
                metadata={"title": entry.title},
            )
        )

        return journal_response(entry)


@router.delete("/{id}", status_code=204, responses=ERROR_RESPONSES)
async def delete_journal_entry(
    id: UUID,
    current_user: User = Depends(get_current_user),
) -> None:
    async with UnitOfWork() as uow:
        repository = JournalRepository(uow.session)
        entry = await repository.get_for_user(current_user.id, id)
        if entry is None:
            raise NotFoundException("Journal entry was not found.")
        await repository.delete(entry)
        await uow.commit()
    return None


@router.post(
    "/{id}/restore", response_model=JournalResponse, status_code=200, responses=ERROR_RESPONSES
)
async def restore_journal_entry(
    id: UUID,
    current_user: User = Depends(get_current_user),
) -> JournalResponse:
    async with UnitOfWork() as uow:
        repository = JournalRepository(uow.session)
        entry = await repository.get_for_user(current_user.id, id, include_deleted=True)
        if entry is None:
            raise NotFoundException("Journal entry was not found.")
        await repository.restore(entry)
        await uow.commit()
        return journal_response(entry)


def journal_response(entry: JournalEntry) -> JournalResponse:
    return JournalResponse(
        id=entry.id,
        title=entry.title,
        content=entry.content,
        tags=list(entry.tags or []),
        source=entry.source,
        version=entry.version,
        created_at=entry.created_at,
        updated_at=entry.updated_at,
    )
