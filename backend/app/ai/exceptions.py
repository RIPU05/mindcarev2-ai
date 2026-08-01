from app.exceptions import AIException


class AIProviderError(AIException):
    code = "ai_provider_error"


class TimeoutError(AIProviderError):
    code = "ai_timeout"


class RateLimitError(AIProviderError):
    status_code = 429
    code = "ai_rate_limited"
