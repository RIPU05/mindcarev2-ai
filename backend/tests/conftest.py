import os
import warnings
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch

# Import all models to ensure they register on Base.metadata
import app.models.analysis  # noqa: F401
import app.models.assistant  # noqa: F401
import app.models.journal  # noqa: F401
import app.models.users  # noqa: F401
import pytest
from app.ai.types import AIResponse, ProviderHealthCheck, TokenUsage
from app.db.base import Base
from app.main import app
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.ext.compiler import compiles
from starlette.middleware.trustedhost import TrustedHostMiddleware

warnings.filterwarnings("ignore", message=".*garbage collector.*")
warnings.filterwarnings("ignore", category=DeprecationWarning)

# Add wildcard '*' dynamically to TrustedHostMiddleware allowed_hosts and force rebuild
for middleware in app.user_middleware:
    if middleware.cls == TrustedHostMiddleware:
        allowed = list(middleware.kwargs.get("allowed_hosts", []))
        if "*" not in allowed:
            allowed.append("*")
            middleware.kwargs["allowed_hosts"] = allowed

# Reset Starlette private middleware stack to apply allowed_hosts updates
app._middleware_stack = None


try:
    from sqlalchemy.dialects.postgresql import JSONB

    @compiles(JSONB, "sqlite")
    def compile_jsonb_sqlite(element, compiler, **kw):
        return "JSON"

except ImportError:
    pass


# Use temporary file to allow connections to share the schema
DATABASE_URL = "sqlite+aiosqlite:///./test_temp.db"


@pytest.fixture(scope="session")
def anyio_backend() -> str:
    return "asyncio"


@pytest.fixture(scope="session")
async def test_engine(anyio_backend: str):
    from sqlalchemy.pool import NullPool

    engine = create_async_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=NullPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

    if os.path.exists("./test_temp.db"):
        try:
            os.remove("./test_temp.db")
        except Exception:
            pass


@pytest.fixture(scope="session", autouse=True)
def override_db_globally(test_engine):
    import app.db
    import app.db.database
    import app.db.session
    import app.db.uow

    test_sessionmaker = async_sessionmaker(test_engine, expire_on_commit=False, class_=AsyncSession)

    app.db.database.engine = test_engine
    app.db.database.AsyncSessionLocal = test_sessionmaker
    app.db.session.AsyncSessionLocal = test_sessionmaker
    app.db.uow.AsyncSessionLocal = test_sessionmaker
    app.db.AsyncSessionLocal = test_sessionmaker

    yield


@pytest.fixture(autouse=True)
def mock_ai_provider():
    mock_prov = MagicMock()
    mock_prov.name = "gemini"
    mock_prov.model = "gemini-1.5-flash"
    mock_prov.generate_reflection = AsyncMock(
        return_value=AIResponse(
            content='{"summary": "test sum", "themes": ["theme1"], "reflection": "test ref", "suggestions": ["sug"], "follow_up_questions": ["q"]}',
            provider="gemini",
            model="gemini-1.5-flash",
            latency_ms=10,
            request_id="mock-req",
            token_usage=TokenUsage(10, 10, 20),
        )
    )
    mock_prov.analyze_text = AsyncMock(
        return_value=AIResponse(
            content='{"risk_level": "low", "categories": [], "requires_escalation": false, "rationale": "ok", "primary_mood": "anxiety", "confidence": 0.9, "emotions": [{"label": "anxiety", "score": 0.8}]}',
            provider="gemini",
            model="gemini-1.5-flash",
            latency_ms=10,
            request_id="mock-req",
            token_usage=TokenUsage(10, 10, 20),
        )
    )
    mock_prov.health = AsyncMock(
        return_value=ProviderHealthCheck(
            provider="gemini", model="gemini-1.5-flash", healthy=True, latency_ms=10
        )
    )

    with (
        patch("app.ai.get_ai_provider", return_value=mock_prov, create=True),
        patch("app.services.factory.get_ai_provider", return_value=mock_prov, create=True),
        patch("app.api.v1.health.get_ai_provider", return_value=mock_prov, create=True),
        patch("app.api.v1.assistant.get_ai_provider", return_value=mock_prov, create=True),
    ):
        yield mock_prov


@pytest.fixture(autouse=True)
def mock_rag_components(mock_ai_provider):
    from app.rag.factory import RAGComponentBundle

    mock_bundle = MagicMock(spec=RAGComponentBundle)
    mock_bundle.vector_store = MagicMock()
    mock_bundle.vector_store.upsert = AsyncMock()
    mock_bundle.retriever = AsyncMock()
    mock_bundle.retriever.retrieve = AsyncMock(return_value=[])
    mock_bundle.context_builder = AsyncMock()
    mock_bundle.prompt_builder = AsyncMock()
    mock_bundle.prompt_builder.build = AsyncMock(
        return_value=MagicMock(system_prompt="sys", user_prompt="usr")
    )
    mock_bundle.ai_provider = mock_ai_provider

    mock_bundle.embedding_provider = MagicMock()
    mock_bundle.embedding_provider.embed_text = AsyncMock()

    with patch("app.rag.factory.get_rag_components", return_value=mock_bundle):
        yield mock_bundle


@pytest.fixture(autouse=True)
def mock_create_task_integration(request):
    import asyncio
    from unittest.mock import patch

    if "test_unit" in request.module.__name__:
        yield
        return

    def safe_create_task(coro, *args, **kwargs):
        if hasattr(coro, "close"):
            coro.close()
        loop = asyncio.get_event_loop()
        fut = loop.create_future()
        fut.set_result(None)
        return fut

    with patch("asyncio.create_task", side_effect=safe_create_task):
        yield


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    import app.db.database

    async with app.db.database.AsyncSessionLocal() as session:
        yield session


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as ac:
        yield ac
