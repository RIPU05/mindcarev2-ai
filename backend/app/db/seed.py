from app.core.logging import get_logger

logger = get_logger(__name__)


async def seed_database() -> None:
    logger.info("database_seed_skipped", extra={"reason": "no_seed_data_configured"})
