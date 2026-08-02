from prometheus_client import Counter, Gauge, Histogram

# Prometheus Collectors
HTTP_REQUESTS_TOTAL = Counter(
    "http_requests_total", "Total HTTP requests count", ["method", "path", "status"]
)
HTTP_REQUEST_DURATION_SECONDS = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency in seconds",
    ["method", "path"],
)
AI_REQUEST_DURATION_SECONDS = Histogram(
    "ai_request_duration_seconds",
    "AI request duration in seconds",
    ["provider", "model", "stage"],
)
AI_TOKEN_USAGE_TOTAL = Counter(
    "ai_token_usage_total", "Total AI token usage", ["provider", "model", "token_type"]
)
AI_ERRORS_TOTAL = Counter("ai_errors_total", "Total AI errors", ["provider", "model", "error_type"])
AI_FAILOVERS_TOTAL = Counter("ai_failovers_total", "Total AI failovers")
CIRCUIT_BREAKER_STATE = Gauge(
    "circuit_breaker_state", "Circuit breaker state", ["provider", "state"]
)
EMBEDDING_GENERATION_DURATION_SECONDS = Histogram(
    "embedding_generation_duration_seconds", "Embedding generation duration in seconds"
)
RAG_RETRIEVAL_DURATION_SECONDS = Histogram(
    "rag_retrieval_duration_seconds", "RAG retrieval duration in seconds"
)
REFLECTION_GENERATION_DURATION_SECONDS = Histogram(
    "reflection_generation_duration_seconds",
    "Reflection generation duration in seconds",
)
AI_ESTIMATED_COST_USD = Counter(
    "ai_estimated_cost_usd", "Estimated AI cost in USD", ["provider", "model"]
)


class SystemMetrics:
    def __init__(self) -> None:
        self._request_count = 0
        self._total_request_latency = 0.0
        self._ai_request_count = 0
        self._ai_failures = 0
        self._total_ai_latency = 0.0
        self._total_input_tokens = 0
        self._total_output_tokens = 0
        self._failures = 0

    @property
    def request_count(self) -> int:
        return self._request_count

    @request_count.setter
    def request_count(self, val: int) -> None:
        self._request_count = val

    @property
    def total_request_latency(self) -> float:
        return self._total_request_latency

    @total_request_latency.setter
    def total_request_latency(self, val: float) -> None:
        self._total_request_latency = val

    @property
    def ai_request_count(self) -> int:
        return self._ai_request_count

    @ai_request_count.setter
    def ai_request_count(self, val: int) -> None:
        self._ai_request_count = val

    @property
    def ai_failures(self) -> int:
        return self._ai_failures

    @ai_failures.setter
    def ai_failures(self, val: int) -> None:
        self._ai_failures = val

    @property
    def total_ai_latency(self) -> float:
        return self._total_ai_latency

    @total_ai_latency.setter
    def total_ai_latency(self, val: float) -> None:
        self._total_ai_latency = val

    @property
    def total_input_tokens(self) -> int:
        return self._total_input_tokens

    @total_input_tokens.setter
    def total_input_tokens(self, val: int) -> None:
        self._total_input_tokens = val

    @property
    def total_output_tokens(self) -> int:
        return self._total_output_tokens

    @total_output_tokens.setter
    def total_output_tokens(self, val: int) -> None:
        self._total_output_tokens = val

    @property
    def failures(self) -> int:
        return self._failures

    @failures.setter
    def failures(self, val: int) -> None:
        self._failures = val


metrics_registry = SystemMetrics()
