from app.core.logging import get_logger
from app.db.base import Base
from app.db.database import engine

logger = get_logger(__name__)


async def reset_database_schema() -> None:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
        await connection.run_sync(Base.metadata.create_all)
    logger.warning("database_schema_reset_completed")
