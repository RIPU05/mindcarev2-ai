from datetime import datetime
from typing import Generic, TypeVar
from uuid import UUID

from sqlalchemy import Select, asc, desc, func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.errors import translate_database_error
from app.utils.datetime import utc_now
from app.utils.pagination import PaginationParams

ModelT = TypeVar("ModelT")


class Repository(Generic[ModelT]):
    model: type[ModelT]

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get(self, entity_id: UUID) -> ModelT | None:
        try:
            return await self.session.get(self.model, entity_id)
        except SQLAlchemyError as exc:
            raise translate_database_error(exc) from exc

    async def get_active(self, entity_id: UUID) -> ModelT | None:
        statement = self._base_select().where(getattr(self.model, "id") == entity_id).limit(1)
        try:
            result = await self.session.scalars(statement)
            return result.first()
        except SQLAlchemyError as exc:
            raise translate_database_error(exc) from exc

    async def list(
        self,
        *,
        limit: int = 50,
        offset: int = 0,
        pagination: PaginationParams | None = None,
        include_deleted: bool = False,
    ) -> list[ModelT]:
        params = pagination or PaginationParams(limit=limit, offset=offset)
        statement = self._apply_pagination(
            self._base_select(include_deleted=include_deleted),
            params,
        )
        try:
            result = await self.session.scalars(statement)
            return list(result)
        except SQLAlchemyError as exc:
            raise translate_database_error(exc) from exc

    async def add(self, entity: ModelT) -> ModelT:
        try:
            self.session.add(entity)
            return entity
        except SQLAlchemyError as exc:
            raise translate_database_error(exc) from exc

    async def count(self, *, include_deleted: bool = False) -> int:
        statement = select(func.count()).select_from(
            self._base_select(include_deleted=include_deleted).subquery()
        )
        try:
            return int(await self.session.scalar(statement) or 0)
        except SQLAlchemyError as exc:
            raise translate_database_error(exc) from exc

    async def update(self, entity: ModelT) -> ModelT:
        try:
            return await self.session.merge(entity)
        except SQLAlchemyError as exc:
            raise translate_database_error(exc) from exc

    async def delete(self, entity: ModelT) -> None:
        try:
            deleted_at = getattr(entity, "deleted_at", None)
            if deleted_at is None and hasattr(entity, "deleted_at"):
                setattr(entity, "deleted_at", utc_now())
                self.session.add(entity)
                return
            await self.session.delete(entity)
        except SQLAlchemyError as exc:
            raise translate_database_error(exc) from exc

    async def restore(self, entity: ModelT) -> ModelT:
        try:
            if hasattr(entity, "deleted_at"):
                setattr(entity, "deleted_at", None)
            self.session.add(entity)
            return entity
        except SQLAlchemyError as exc:
            raise translate_database_error(exc) from exc

    def _base_select(self, *, include_deleted: bool = False) -> Select[tuple[ModelT]]:
        statement = select(self.model)
        if not include_deleted and hasattr(self.model, "deleted_at"):
            statement = statement.where(getattr(self.model, "deleted_at").is_(None))
        return statement

    def _apply_pagination(
        self,
        statement: Select[tuple[ModelT]],
        params: PaginationParams,
    ) -> Select[tuple[ModelT]]:
        sort_column = getattr(self.model, params.sort_by, None)
        if sort_column is not None:
            direction = asc if params.sort_direction == "asc" else desc
            statement = statement.order_by(direction(sort_column))
        return statement.limit(params.limit).offset(params.offset)
