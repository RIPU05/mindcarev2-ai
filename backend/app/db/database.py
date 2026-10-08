import asyncio
from collections.abc import AsyncIterator
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


def create_engine(database_url: str | None = None) -> AsyncEngine:
    url = database_url or settings.database_url
    connect_args: dict[str, Any] = {}
    if "asyncpg" in url:
        # Disable asyncpg prepared statement caching for PgBouncer / Supavisor Transaction Pooler compatibility
        connect_args["prepared_statement_cache_size"] = 0

    return create_async_engine(
        url,
        echo=settings.database_echo,
        pool_pre_ping=True,
        pool_size=settings.database_pool_size,
        max_overflow=settings.database_max_overflow,
        connect_args=connect_args,
    )


engine = create_engine()
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, autoflush=False)


async def init_database_tables() -> None:
    try:
        import app.models  # noqa: F401
        from app.db.base import Base

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("database_tables_initialized_successfully")
    except Exception as exc:
        logger.error(f"Failed to initialize database tables: {exc}")


async def verify_database_connection() -> None:
    max_retries = 3
    retry_delay = 2.0
    for attempt in range(1, max_retries + 1):
        try:
            async with engine.connect() as connection:
                await connection.execute(text("SELECT 1"))
            logger.info("database_connection_verified")
            await init_database_tables()
            return
        except Exception as exc:
            logger.warning(
                f"Database connection verification attempt {attempt}/{max_retries} failed: {exc}"
            )
            if attempt == max_retries:
                logger.error(
                    "Database connection verification failed on startup; proceeding with server startup to allow /health/live probes.",
                    extra={"error": str(exc)},
                )
                return
            await asyncio.sleep(retry_delay)


async def dispose_database_engine() -> None:
    await engine.dispose()
    logger.info("database_engine_disposed")


async def database_lifespan() -> AsyncIterator[None]:
    await verify_database_connection()
    try:
        yield
    finally:
        await dispose_database_engine()

