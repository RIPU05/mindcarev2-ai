from uuid import UUID

from sqlalchemy import Select, func, select
from sqlalchemy.exc import SQLAlchemyError

from app.db.errors import translate_database_error
from app.models.journal import JournalEntry
from app.repositories.base import Repository
from app.schemas.enums import JournalSource
from app.utils.pagination import PaginationParams


class JournalRepository(Repository[JournalEntry]):
    model = JournalEntry

    def scoped_select(
        self,
        user_id: UUID,
        *,
        include_deleted: bool = False,
        source: JournalSource | None = None,
        search: str | None = None,
    ) -> Select[tuple[JournalEntry]]:
        statement = self._base_select(include_deleted=include_deleted).where(
            JournalEntry.user_id == user_id
        )
        if source is not None:
            statement = statement.where(JournalEntry.source == source)
        if search:
            pattern = f"%{search}%"
            statement = statement.where(
                JournalEntry.content.ilike(pattern) | JournalEntry.title.ilike(pattern)
            )
        return statement

    async def get_for_user(
        self,
        user_id: UUID,
        entry_id: UUID,
        *,
        include_deleted: bool = False,
    ) -> JournalEntry | None:
        statement = (
            self.scoped_select(user_id, include_deleted=include_deleted)
            .where(JournalEntry.id == entry_id)
            .limit(1)
        )
        try:
            return (await self.session.scalars(statement)).first()
        except SQLAlchemyError as exc:
            raise translate_database_error(exc) from exc

    async def list_for_user(
        self,
        user_id: UUID,
        *,
        pagination: PaginationParams,
        include_deleted: bool = False,
        source: JournalSource | None = None,
        search: str | None = None,
    ) -> list[JournalEntry]:
        statement = self._apply_pagination(
            self.scoped_select(
                user_id, include_deleted=include_deleted, source=source, search=search
            ),
            pagination,
        )
        try:
            return list(await self.session.scalars(statement))
        except SQLAlchemyError as exc:
            raise translate_database_error(exc) from exc

    async def count_for_user(
        self,
        user_id: UUID,
        *,
        include_deleted: bool = False,
        source: JournalSource | None = None,
        search: str | None = None,
    ) -> int:
        statement = select(func.count()).select_from(
            self.scoped_select(
                user_id, include_deleted=include_deleted, source=source, search=search
            ).subquery()
        )
        try:
            return int(await self.session.scalar(statement) or 0)
        except SQLAlchemyError as exc:
            raise translate_database_error(exc) from exc
