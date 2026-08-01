from collections.abc import AsyncIterator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


def create_engine(database_url: str | None = None) -> AsyncEngine:
    url = database_url or settings.database_url
    return create_async_engine(
        url,
        echo=settings.database_echo,
        pool_pre_ping=True,
        pool_size=settings.database_pool_size,
        max_overflow=settings.database_max_overflow,
    )


engine = create_engine()
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, autoflush=False)


async def verify_database_connection() -> None:
    async with engine.connect() as connection:
        await connection.execute(text("SELECT 1"))
    logger.info("database_connection_verified")


async def dispose_database_engine() -> None:
    await engine.dispose()
    logger.info("database_engine_disposed")


async def database_lifespan() -> AsyncIterator[None]:
    await verify_database_connection()
    try:
        yield
    finally:
        await dispose_database_engine()
