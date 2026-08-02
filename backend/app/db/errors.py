from sqlalchemy.exc import IntegrityError, NoResultFound, SQLAlchemyError

from app.exceptions import (
    ConflictException,
    DatabaseException,
    MindCareException,
    NotFoundException,
)


def translate_database_error(error: SQLAlchemyError) -> MindCareException:
    if isinstance(error, IntegrityError):
        return ConflictException("Database constraint conflict.", details={"source": "database"})
    if isinstance(error, NoResultFound):
        return NotFoundException("Database record was not found.", details={"source": "database"})
    return DatabaseException("Database operation failed.", details={"source": "database"})
