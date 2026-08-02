from types import TracebackType

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import AsyncSessionLocal
from app.db.errors import translate_database_error


class UnitOfWork:
    session: AsyncSession

    def __init__(self, session: AsyncSession | None = None) -> None:
        self.session = session  # type: ignore
        self._owns_session = session is None

    async def __aenter__(self) -> "UnitOfWork":
        if self.session is None:
            self.session = AsyncSessionLocal()
        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        traceback: TracebackType | None,
    ) -> None:
        if exc is not None:
            await self.rollback()
        if self._owns_session and self.session is not None:
            await self.session.close()

    async def commit(self) -> None:
        if self.session is None:
            raise RuntimeError("UnitOfWork session is not initialized.")
        try:
            await self.session.commit()
        except SQLAlchemyError as exc:
            await self.session.rollback()
            raise translate_database_error(exc) from exc

    async def rollback(self) -> None:
        if self.session is not None:
            await self.session.rollback()
