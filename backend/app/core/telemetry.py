import logging
import os
import sys

from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter

logger = logging.getLogger(__name__)


# 1. TracerProvider init
provider = TracerProvider()

# 2. Check for OTLP endpoint
otlp_endpoint = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT") or os.getenv(
    "OTEL_EXPORTER_OTLP_TRACES_ENDPOINT"
)

if "pytest" in sys.modules or os.getenv("APP_ENV") == "testing":
    from opentelemetry.sdk.trace.export import SimpleSpanProcessor
    from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter

    provider.add_span_processor(SimpleSpanProcessor(InMemorySpanExporter()))
elif otlp_endpoint:
    try:
        # Prefer gRPC or HTTP OTLP Exporter
        from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter

        exporter = OTLPSpanExporter(endpoint=otlp_endpoint, insecure=True)
        provider.add_span_processor(BatchSpanProcessor(exporter))
        logger.info(f"OpenTelemetry OTLP Exporter configured at endpoint: {otlp_endpoint}")
    except Exception as e:
        logger.warning(
            f"Failed to initialize OTLP Exporter ({e}). Falling back to Console Exporter."
        )
        provider.add_span_processor(BatchSpanProcessor(ConsoleSpanExporter()))
else:
    # Use console processor locally to avoid network blockage
    provider.add_span_processor(BatchSpanProcessor(ConsoleSpanExporter()))

trace.set_tracer_provider(provider)
tracer = trace.get_tracer("mindcare")


def instrument_fastapi_app(app) -> None:
    try:
        from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

        FastAPIInstrumentor.instrument_app(app)
        logger.info("FastAPI application instrumented with OpenTelemetry.")
    except Exception as e:
        logger.error(f"Failed to instrument FastAPI application: {e}")
