from dataclasses import dataclass, field
from decimal import Decimal
from enum import StrEnum
from typing import Any


class AIProviderName(StrEnum):
    GEMINI = "gemini"
    OPENAI = "openai"
    CLAUDE = "claude"
    GROQ = "groq"
    OLLAMA = "ollama"


@dataclass(frozen=True)
class TokenUsage:
    input_tokens: int | None = None
    output_tokens: int | None = None
    total_tokens: int | None = None


@dataclass(frozen=True)
class AIResponse:
    content: str
    provider: str
    model: str
    latency_ms: int
    request_id: str
    token_usage: TokenUsage = field(default_factory=TokenUsage)
    cost_usd: Decimal | None = None
    raw: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class ProviderHealthCheck:
    provider: str
    model: str
    healthy: bool
    latency_ms: int | None = None
    error: str | None = None


@dataclass(frozen=True)
class RetryPolicy:
    max_retries: int
    timeout_seconds: float
    retryable_status_codes: tuple[int, ...] = (429, 500, 502, 503, 504)


@dataclass(frozen=True)
class FallbackPolicy:
    enabled: bool = False
    provider_order: tuple[str, ...] = ("gemini",)
