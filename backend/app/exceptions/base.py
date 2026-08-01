class MindCareException(Exception):
    status_code = 500
    code = "internal_error"

    def __init__(self, message: str, *, details: dict | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.details = details or {}


class ValidationException(MindCareException):
    status_code = 422
    code = "validation_error"


class NotFoundException(MindCareException):
    status_code = 404
    code = "not_found"


class ConflictException(MindCareException):
    status_code = 409
    code = "conflict"


class DatabaseException(MindCareException):
    status_code = 500
    code = "database_error"


class AIException(MindCareException):
    status_code = 503
    code = "ai_error"


class AuthenticationException(MindCareException):
    status_code = 401
    code = "authentication_error"


class MissingTokenException(AuthenticationException):
    code = "missing_token"


class InvalidTokenException(AuthenticationException):
    code = "invalid_token"


class ExpiredTokenException(AuthenticationException):
    code = "expired_token"


class ForbiddenException(MindCareException):
    status_code = 403
    code = "forbidden"
