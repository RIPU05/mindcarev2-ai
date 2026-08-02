import asyncio
import statistics
import time
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.ext.compiler import compiles

# Import all models to ensure they register on Base.metadata
import app.models.analysis  # noqa: F401
import app.models.assistant  # noqa: F401
import app.models.journal  # noqa: F401
import app.models.users  # noqa: F401
from app.ai.types import AIResponse, ProviderHealthCheck, TokenUsage
from app.db.base import Base
from app.models.journal import JournalEntry
from app.rag.types import SearchQuery
from app.schemas.enums import JournalSource

try:
    from sqlalchemy.dialects.postgresql import JSONB

    @compiles(JSONB, "sqlite")
    def compile_jsonb_sqlite(element, compiler, **kw):
        return "JSON"

except ImportError:
    pass

DATABASE_URL = "sqlite+aiosqlite:///./benchmark_temp.db"


def calculate_stats(latencies):
    if not latencies:
        return 0, 0, 0, 0
    mean_val = statistics.mean(latencies)
    min_val = min(latencies)
    max_val = max(latencies)
    std_val = statistics.stdev(latencies) if len(latencies) > 1 else 0.0
    return mean_val, min_val, max_val, std_val


async def run_benchmarks():
    print("====================================================")
    print("            MINDCARE AI PERFORMANCE BENCHMARKS      ")
    print("====================================================")

    # 1. Database Setup
    engine = create_async_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    sessionmaker = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    session = sessionmaker()

    # Seed some data for retriever benchmark
    user_id = uuid4()
    for i in range(50):
        entry = JournalEntry(
            id=uuid4(),
            user_id=user_id,
            title=f"Sample Journal {i}",
            content="Today was a standard day with standard events.",
            source=JournalSource.MANUAL,
        )
        session.add(entry)
    await session.commit()

    # 2. Setup mock AI/RAG bundle
    mock_prov = MagicMock()
    mock_prov.generate_reflection = AsyncMock(
        return_value=AIResponse(
            content='{"summary": "Test", "themes": [], "reflection": "Ref", "suggestions": [], "follow_up_questions": []}',
            provider="gemini",
            model="gemini-1.5-flash",
            latency_ms=10,
            request_id="benchmark",
            token_usage=TokenUsage(10, 10, 20),
        )
    )
    mock_prov.analyze_text = AsyncMock(
        return_value=AIResponse(
            content='{"risk_level": "low", "categories": [], "requires_escalation": false, "rationale": "ok", "primary_mood": "neutral", "confidence": 0.9, "emotions": []}',
            provider="gemini",
            model="gemini-1.5-flash",
            latency_ms=10,
            request_id="benchmark",
            token_usage=TokenUsage(10, 10, 20),
        )
    )
    mock_prov.health = AsyncMock(
        return_value=ProviderHealthCheck(
            provider="gemini", model="gemini-1.5-flash", healthy=True, latency_ms=10
        )
    )

    # Setup RAG retrievers
    from app.rag.retriever import SqlCompositeRetriever, SqlJournalRetriever

    j_ret = SqlJournalRetriever(session)
    composite_retriever = SqlCompositeRetriever(retrievers=[j_ret], semantic_search=None)

    mock_embedding_provider = MagicMock()
    mock_embedding_provider.embed_text = AsyncMock(return_value=MagicMock(vector=[0.1] * 1536))

    # Setup AI Failover logic components
    from app.ai.providers.reliable import ReliableAIProviderWrapper

    mock_failing_prov = MagicMock()
    mock_failing_prov.generate_reflection = AsyncMock(
        side_effect=Exception("Failing Primary Provider")
    )

    mock_succeeding_prov = MagicMock()
    mock_succeeding_prov.generate_reflection = AsyncMock(
        return_value=AIResponse(
            content='{"summary": "Test", "themes": [], "reflection": "Ref", "suggestions": [], "follow_up_questions": []}',
            provider="openai",
            model="gpt-4o-mini",
            latency_ms=5,
            request_id="failover",
            token_usage=TokenUsage(10, 10, 20),
        )
    )

    failover_wrapper = ReliableAIProviderWrapper(primary_provider_name="gemini")

    def builder_map(name):
        if name == "gemini":
            return lambda: mock_failing_prov
        return lambda: mock_succeeding_prov

    failover_wrapper.get_provider_builder = builder_map

    iterations = 30
    latencies = {
        "AI Reflection Generation": [],
        "Composite SQL Retrieval": [],
        "Text Embedding Generation": [],
        "AI Provider Failover": [],
    }

    # Run Benchmark Loop
    for _ in range(iterations):
        # AI Reflection Latency
        t_start = time.perf_counter()
        await mock_prov.generate_reflection("Benchmark entry text", context={"primary_mood": "sad"})
        latencies["AI Reflection Generation"].append((time.perf_counter() - t_start) * 1000.0)

        # Retrieval Latency
        t_start = time.perf_counter()
        query = SearchQuery(user_id=user_id, text="standard", limit=8)
        await composite_retriever.retrieve(query)
        latencies["Composite SQL Retrieval"].append((time.perf_counter() - t_start) * 1000.0)

        # Embedding Latency
        t_start = time.perf_counter()
        from app.rag.types import EmbeddingRequest

        await mock_embedding_provider.embed_text(
            EmbeddingRequest(text="Embed this benchmark sentence.")
        )
        latencies["Text Embedding Generation"].append((time.perf_counter() - t_start) * 1000.0)

        # AI Failover Latency
        t_start = time.perf_counter()
        with patch(
            "app.ai.providers.reliable.get_provider_priority_list",
            return_value=["gemini", "openai"],
        ):
            await failover_wrapper.generate_reflection(
                "Benchmark failover text", context={"primary_mood": "sad"}
            )
        latencies["AI Provider Failover"].append((time.perf_counter() - t_start) * 1000.0)

    # Measure Concurrent Requests timings
    concurrent_latencies = []

    async def concurrent_task():
        t0 = time.perf_counter()
        await mock_prov.generate_reflection(
            "Concurrent request text", context={"primary_mood": "sad"}
        )
        return (time.perf_counter() - t0) * 1000.0

    for _ in range(5):
        t_start = time.perf_counter()
        await asyncio.gather(*(concurrent_task() for _ in range(10)))
        concurrent_latencies.append((time.perf_counter() - t_start) * 1000.0)

    # 3. Print Results Report
    print(f"\nBenchmark results across {iterations} iterations:")
    print(
        f"{'Metric':<30} | {'Mean (ms)':<10} | {'Min (ms)':<10} | {'Max (ms)':<10} | {'StdDev (ms)':<10}"
    )
    print("-" * 80)

    report_lines = []
    report_lines.append("# MindCare AI Performance Benchmark Report\n")
    report_lines.append("## Micro-Benchmark Latencies (across 30 iterations)\n")
    report_lines.append("| Metric | Mean (ms) | Min (ms) | Max (ms) | StdDev (ms) |")
    report_lines.append("| :--- | :--- | :--- | :--- | :--- |")

    for metric, values in latencies.items():
        mean_val, min_val, max_val, std_val = calculate_stats(values)
        print(
            f"{metric:<30} | {mean_val:<10.2f} | {min_val:<10.2f} | {max_val:<10.2f} | {std_val:<10.2f}"
        )
        report_lines.append(
            f"| {metric} | {mean_val:.2f} | {min_val:.2f} | {max_val:.2f} | {std_val:.2f} |"
        )

    c_mean, c_min, c_max, c_std = calculate_stats(concurrent_latencies)
    print(
        f"{'10 Concurrent Requests Total':<30} | {c_mean:<10.2f} | {c_min:<10.2f} | {c_max:<10.2f} | {c_std:<10.2f}"
    )
    report_lines.append("\n## Concurrency Load Benchmarks (10 Parallel Requests)\n")
    report_lines.append(f"- **Mean Duration**: {c_mean:.2f} ms")
    report_lines.append(f"- **Min Duration**: {c_min:.2f} ms")
    report_lines.append(f"- **Max Duration**: {c_max:.2f} ms")

    # Write report file
    with open("./benchmark_report.md", "w") as f:
        f.write("\n".join(report_lines))
    print("\nSuccessfully generated 'benchmark_report.md'")

    # 4. Cleanup
    await session.close()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

    import os

    if os.path.exists("./benchmark_temp.db"):
        try:
            os.remove("./benchmark_temp.db")
        except Exception:
            pass


if __name__ == "__main__":
    asyncio.run(run_benchmarks())
