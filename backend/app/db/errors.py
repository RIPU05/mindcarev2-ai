from sqlalchemy.exc import IntegrityError, NoResultFound, SQLAlchemyError

from app.exceptions import (
    ConflictException,
    DatabaseException,
    MindCareException,
    NotFoundException,
)


from app.core.logging import get_logger

logger = get_logger(__name__)


def translate_database_error(error: SQLAlchemyError) -> MindCareException:
    logger.error("database_exception_caught", extra={"error": str(error), "error_type": type(error).__name__})
    if isinstance(error, IntegrityError):
        return ConflictException("Database constraint conflict.", details={"source": "database", "error": str(error.orig if hasattr(error, 'orig') else error)})
    if isinstance(error, NoResultFound):
        return NotFoundException("Database record was not found.", details={"source": "database"})
    return DatabaseException("Database operation failed.", details={"source": "database", "error": str(error.orig if hasattr(error, 'orig') else error)})

