import asyncio
import logging
import time
from typing import Any

from app.ai.exceptions import AIProviderError
from app.ai.providers.base import AIProvider
from app.ai.types import AIResponse, ProviderHealthCheck, TokenUsage
from app.core.config import settings

logger = logging.getLogger(__name__)


class CircuitBreaker:
    def __init__(self, failure_threshold: int = 5, recovery_timeout_seconds: float = 60.0) -> None:
        self.failure_threshold = failure_threshold
        self.recovery_timeout_seconds = recovery_timeout_seconds
        self.failures = 0
        self.last_failure_time = 0.0
        self.state = "CLOSED"  # CLOSED, OPEN, HALF-OPEN
        self.provider_name = "unknown"

    def record_success(self) -> None:
        self.failures = 0
        self.state = "CLOSED"
        self._update_metrics()

    def record_failure(self) -> None:
        self.failures += 1
        self.last_failure_time = time.time()
        if self.failures >= self.failure_threshold:
            self.state = "OPEN"
        self._update_metrics()

    def can_execute(self) -> bool:
        if self.state == "OPEN":
            if time.time() - self.last_failure_time > self.recovery_timeout_seconds:
                self.state = "HALF-OPEN"
                self._update_metrics()
                return True
            return False
        return True

    def _update_metrics(self) -> None:
        try:
            from app.core.metrics import CIRCUIT_BREAKER_STATE

            CIRCUIT_BREAKER_STATE.labels(provider=self.provider_name, state=self.state).set(1)
            for other in ["CLOSED", "OPEN", "HALF-OPEN"]:
                if other != self.state:
                    CIRCUIT_BREAKER_STATE.labels(provider=self.provider_name, state=other).set(0)
        except Exception:
            pass


_circuit_breakers: dict[str, CircuitBreaker] = {}


def get_circuit_breaker(provider_name: str) -> CircuitBreaker:
    name_lower = provider_name.lower()
    if name_lower not in _circuit_breakers:
        cb = CircuitBreaker()
        cb.provider_name = name_lower
        _circuit_breakers[name_lower] = cb
    return _circuit_breakers[name_lower]


def get_provider_priority_list() -> list[str]:
    # Configurable priority order from settings or environment
    priority_str = getattr(settings, "ai_provider_priority", "gemini,openai,claude,groq,ollama")
    raw_list = [p.strip().lower() for p in priority_str.split(",")]
    from app.ai.registry import registered_providers

    registered = set(registered_providers())
    return [p for p in raw_list if p in registered]


def compute_estimated_cost(provider: str, model: str, usage: TokenUsage | None) -> float | None:
    if not usage or usage.total_tokens is None:
        return None
    # Pricing per 1M tokens (input / output)
    pricing = {
        "gemini": {
            "gemini-1.5-flash": (0.075, 0.30),
            "text-embedding-004": (0.025, 0.0),
        },
        "openai": {
            "gpt-4o-mini": (0.150, 0.600),
            "text-embedding-3-small": (0.020, 0.0),
        },
        "claude": {
            "claude-3-5-sonnet": (3.0, 15.0),
        },
        "groq": {
            "llama3-8b": (0.05, 0.10),
        },
    }
    prov = provider.lower()
    mod = model.lower()

    prov_match = next((p for p in pricing if p in prov), None)
    if not prov_match:
        return 0.0

    model_match = next((m for m in pricing[prov_match] if m in mod), None)
    if not model_match:
        input_cost = 0.15 / 1_000_000
        output_cost = 0.60 / 1_000_000
    else:
        input_cost = pricing[prov_match][model_match][0] / 1_000_000
        output_cost = pricing[prov_match][model_match][1] / 1_000_000

    in_tokens = usage.input_tokens or 0
    out_tokens = usage.output_tokens or 0
    return (in_tokens * input_cost) + (out_tokens * output_cost)


class ReliableAIProviderWrapper(AIProvider):
    def __init__(self, primary_provider_name: str | None = None) -> None:
        self.primary_provider_name = primary_provider_name
        from app.ai.registry import get_provider_builder

        self.get_provider_builder = get_provider_builder

    @property
    def name(self) -> str:
        return self.primary_provider_name or "reliable_wrapper"

    @property
    def model(self) -> str:
        return "reliable_model"

    async def analyze_text(self, text: str, *, system_prompt: str | None = None) -> AIResponse:
        return await self._execute_with_failover("analyze_text", text, system_prompt=system_prompt)

    async def generate_reflection(
        self, text: str, *, context: dict[str, Any] | None = None
    ) -> AIResponse:
        return await self._execute_with_failover("generate_reflection", text, context=context)

    async def summarize(self, text: str, *, context: dict[str, Any] | None = None) -> AIResponse:
        return await self._execute_with_failover("summarize", text, context=context)

    async def analyze_audio(
        self, audio_reference: str, *, context: dict[str, Any] | None = None
    ) -> AIResponse:
        return await self._execute_with_failover("analyze_audio", audio_reference, context=context)

    async def health(self) -> ProviderHealthCheck:
        name = (self.primary_provider_name or "gemini").lower()
        builder = self.get_provider_builder(name)
        if builder:
            try:
                prov = builder()
                return await prov.health()
            except Exception as e:
                return ProviderHealthCheck(
                    provider=name, model="unknown", healthy=False, latency_ms=0, error=str(e)
                )
        return ProviderHealthCheck(
            provider=name, model="unknown", healthy=False, latency_ms=0, error="Builder not found"
        )

    async def _execute_with_failover(self, method_name: str, *args, **kwargs) -> AIResponse:
        priority_list = get_provider_priority_list()

        if self.primary_provider_name:
            primary = self.primary_provider_name.lower()
            if primary in priority_list:
                priority_list.remove(primary)
            priority_list.insert(0, primary)

        last_error = None

        from app.core.telemetry import tracer
        from app.core.metrics import (
            AI_REQUEST_DURATION_SECONDS,
            AI_TOKEN_USAGE_TOTAL,
            AI_ERRORS_TOTAL,
            AI_FAILOVERS_TOTAL,
            AI_ESTIMATED_COST_USD,
        )

        with tracer.start_as_current_span(f"ai_provider.{method_name}") as span:
            span.set_attribute("ai.method", method_name)

            for provider_idx, provider_name in enumerate(priority_list):
                if provider_idx > 0:
                    AI_FAILOVERS_TOTAL.inc()
                    span.add_event(f"failover_to_{provider_name}")

                cb = get_circuit_breaker(provider_name)
                if not cb.can_execute():
                    logger.warning(
                        f"Circuit breaker for provider '{provider_name}' is OPEN. Skipping."
                    )
                    continue

                builder = self.get_provider_builder(provider_name)
                if not builder:
                    continue

                max_retries = 2
                for attempt in range(max_retries + 1):
                    try:
                        provider_instance = builder()
                        method = getattr(provider_instance, method_name)

                        started = time.perf_counter()
                        timeout = getattr(settings, "ai_timeout", 15) or 15

                        with tracer.start_as_current_span(
                            f"ai_provider.{provider_name}.attempt_{attempt}"
                        ) as attempt_span:
                            attempt_span.set_attribute("ai.provider", provider_name)
                            attempt_span.set_attribute("ai.attempt", attempt + 1)

                            response = await asyncio.wait_for(
                                method(*args, **kwargs), timeout=float(timeout)
                            )

                        cb.record_success()
                        duration_seconds = time.perf_counter() - started
                        latency_ms = int(duration_seconds * 1000)

                        from app.core.metrics import metrics_registry

                        metrics_registry.ai_request_count += 1
                        metrics_registry.total_ai_latency += latency_ms
                        metrics_registry.total_input_tokens += (
                            response.token_usage.input_tokens or 0
                        )
                        metrics_registry.total_output_tokens += (
                            response.token_usage.output_tokens or 0
                        )

                        cost = compute_estimated_cost(
                            response.provider, response.model, response.token_usage
                        )

                        AI_REQUEST_DURATION_SECONDS.labels(
                            provider=response.provider, model=response.model, stage=method_name
                        ).observe(duration_seconds)

                        AI_TOKEN_USAGE_TOTAL.labels(
                            provider=response.provider, model=response.model, token_type="input"
                        ).inc(response.token_usage.input_tokens or 0)

                        AI_TOKEN_USAGE_TOTAL.labels(
                            provider=response.provider, model=response.model, token_type="output"
                        ).inc(response.token_usage.output_tokens or 0)

                        if cost is not None:
                            AI_ESTIMATED_COST_USD.labels(
                                provider=response.provider, model=response.model
                            ).inc(cost)

                        # Structured logging format for observability
                        logger.info(
                            "AI_Request_Completed",
                            extra={
                                "provider": response.provider,
                                "model": response.model,
                                "latency_ms": latency_ms,
                                "input_tokens": response.token_usage.input_tokens,
                                "output_tokens": response.token_usage.output_tokens,
                                "estimated_cost_usd": cost,
                                "attempt": attempt + 1,
                                "method": method_name,
                            },
                        )

                        if cost is not None:
                            import dataclasses

                            response = dataclasses.replace(response, cost_usd=cost)

                        return response

                    except asyncio.TimeoutError as exc:
                        from app.core.metrics import metrics_registry

                        metrics_registry.ai_failures += 1
                        cb.record_failure()
                        last_error = exc

                        AI_ERRORS_TOTAL.labels(
                            provider=provider_name, model="unknown", error_type="timeout"
                        ).inc()

                        logger.warning(
                            f"AI Request Timed Out (limit={timeout}s) for provider '{provider_name}' on attempt {attempt + 1}"
                        )
                        if attempt < max_retries:
                            await asyncio.sleep(0.3 * (attempt + 1))

                    except Exception as exc:
                        from app.core.metrics import metrics_registry

                        metrics_registry.ai_failures += 1
                        cb.record_failure()
                        last_error = exc

                        AI_ERRORS_TOTAL.labels(
                            provider=provider_name, model="unknown", error_type="exception"
                        ).inc()

                        logger.warning(
                            f"AI request attempt {attempt + 1} failed for provider '{provider_name}'. Error: {exc}"
                        )
                        if attempt < max_retries:
                            await asyncio.sleep(0.3 * (attempt + 1))

                logger.error(
                    f"Provider '{provider_name}' failed all retries. Failing over to next registered provider."
                )

            raise AIProviderError(f"All AI providers failed. Last error: {last_error}")
