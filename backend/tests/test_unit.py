from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.ai.providers.reliable import CircuitBreaker, ReliableAIProviderWrapper
from app.ai.types import AIResponse, TokenUsage
from app.auth.hashing import hash_password, verify_password
from app.auth.rate_limiter import AuthRateLimiter
from app.rag.embeddings import InMemoryEmbeddingCache
from app.services.ai_json import retry_on_json_error
from fastapi import HTTPException, Request


# 1. Hashing Test
def test_password_hashing():
    pw = "supersecurepassword"
    hashed = hash_password(pw)
    assert hashed.startswith("scrypt$")
    assert verify_password(pw, hashed)
    assert not verify_password("wrong", hashed)


# 2. Rate Limiting Test
@pytest.mark.anyio
async def test_rate_limiter():
    limiter = AuthRateLimiter(requests_limit=2, window_seconds=10)
    request = MagicMock(spec=Request)
    request.client = MagicMock()
    request.client.host = "127.0.0.1"

    # First 2 requests pass
    await limiter(request)
    await limiter(request)

    # 3rd request fails
    with pytest.raises(HTTPException) as exc:
        await limiter(request)
    assert exc.value.status_code == 429


# 3. Circuit Breaker Test
def test_circuit_breaker():
    cb = CircuitBreaker(failure_threshold=2, recovery_timeout_seconds=0.1)
    assert cb.can_execute()

    cb.record_failure()
    assert cb.can_execute()

    cb.record_failure()
    assert not cb.can_execute()


# 4. JSON Retry Logic Test
@pytest.mark.anyio
async def test_json_retry_logic():
    calls = 0

    async def failing_json_func():
        nonlocal calls
        calls += 1
        if calls < 2:
            raise ValueError("Invalid JSON string")
        return "success"

    res = await retry_on_json_error(failing_json_func)
    assert res == "success"
    assert calls == 2


# 5. Embedding Cache Test
@pytest.mark.anyio
async def test_embedding_cache():
    cache = InMemoryEmbeddingCache()
    await cache.set("hello", [0.1, 0.2, 0.3])
    assert await cache.get("hello") == [0.1, 0.2, 0.3]
    assert await cache.get("nonexistent") is None


@pytest.mark.anyio
async def test_chunk_text():
    from app.rag.embeddings import chunk_text

    text = "a" * 1500
    chunks = chunk_text(text, max_chars=1000, overlap=200)
    assert len(chunks) == 2
    assert chunks[0] == "a" * 1000
    assert len(chunks[1]) == 700


@pytest.mark.anyio
async def test_retry_async_exhausted():
    from app.rag.embeddings import retry_async

    calls = 0

    async def failing_func():
        nonlocal calls
        calls += 1
        raise ValueError("failing")

    with pytest.raises(ValueError):
        await retry_async(failing_func, max_retries=2, initial_delay=0.01)
    assert calls == 2


@pytest.mark.anyio
async def test_generate_and_store_embedding_error_logging():
    from uuid import uuid4

    from app.rag.embeddings import generate_and_store_embedding
    from app.rag.types import RetrievalSource

    with patch("app.rag.factory.get_rag_components") as mock_get_rag:
        mock_get_rag.side_effect = Exception("failed to get components")
        await generate_and_store_embedding(
            text="hello",
            source=RetrievalSource.JOURNAL,
            document_id=uuid4(),
            user_id=uuid4(),
        )


@pytest.mark.anyio
async def test_generate_and_store_embedding_missing_components():
    from uuid import uuid4

    from app.rag.embeddings import generate_and_store_embedding
    from app.rag.types import RetrievalSource

    with patch("app.rag.factory.get_rag_components") as mock_get_rag:
        mock_components = MagicMock()
        mock_components.embedding_provider = None
        mock_components.vector_store = None
        mock_get_rag.return_value = mock_components
        await generate_and_store_embedding(
            text="hello",
            source=RetrievalSource.JOURNAL,
            document_id=uuid4(),
            user_id=uuid4(),
        )


# 6. Reliable Wrapper Test
@pytest.mark.anyio
async def test_reliable_provider_wrapper():
    mock_prov = MagicMock()
    mock_prov.generate_reflection = AsyncMock(
        return_value=AIResponse(
            content='{"summary": "test sum", "themes": ["theme1"], "reflection": "test ref", "suggestions": ["sug"], "follow_up_questions": ["q"]}',
            provider="mock",
            model="mock-model",
            latency_ms=100,
            request_id="test-req-id",
            token_usage=TokenUsage(input_tokens=10, output_tokens=10, total_tokens=20),
        )
    )

    wrapper = ReliableAIProviderWrapper()
    wrapper.get_provider_builder = lambda name: lambda: mock_prov

    res = await wrapper.generate_reflection("hello text", context={"primary_mood": "sad"})
    assert res.provider == "mock"
    assert "test ref" in res.content


# 7. Embedding Providers Tests
@pytest.mark.anyio
async def test_gemini_embedding_provider():
    from app.rag.embeddings import GeminiEmbeddingProvider
    from app.rag.types import EmbeddingRequest

    mock_res = MagicMock()
    mock_res.status_code = 200
    mock_res.json = MagicMock(return_value={"embeddings": [{"values": [0.1, 0.2, 0.3]}]})
    mock_res.raise_for_status = MagicMock()

    with patch("httpx.AsyncClient.post", return_value=mock_res):
        prov = GeminiEmbeddingProvider()
        res = await prov.embed_text(EmbeddingRequest(text="hello"))
        assert res.vector == [0.1, 0.2, 0.3]
        assert res.provider == "gemini"
        assert res.dimensions == 3


@pytest.mark.anyio
async def test_openai_embedding_provider():
    from app.rag.embeddings import OpenAIEmbeddingProvider
    from app.rag.types import EmbeddingRequest

    mock_res = MagicMock()
    mock_res.status_code = 200
    mock_res.json = MagicMock(
        return_value={
            "data": [{"embedding": [0.4, 0.5, 0.6], "index": 0}],
            "usage": {"total_tokens": 5},
        }
    )
    mock_res.raise_for_status = MagicMock()

    with patch("httpx.AsyncClient.post", return_value=mock_res):
        prov = OpenAIEmbeddingProvider()
        res = await prov.embed_text(EmbeddingRequest(text="hello"))
        assert res.vector == [0.4, 0.5, 0.6]
        assert res.provider == "openai"
        assert res.token_usage["total_tokens"] == 5


@pytest.mark.anyio
async def test_ollama_embedding_provider():
    from app.rag.embeddings import OllamaEmbeddingProvider
    from app.rag.types import EmbeddingRequest

    mock_res = MagicMock()
    mock_res.status_code = 200
    mock_res.json = MagicMock(return_value={"embedding": [0.7, 0.8, 0.9]})
    mock_res.raise_for_status = MagicMock()

    with patch("httpx.AsyncClient.post", return_value=mock_res):
        prov = OllamaEmbeddingProvider()
        res = await prov.embed_text(EmbeddingRequest(text="hello"))
        assert res.vector == [0.7, 0.8, 0.9]
        assert res.provider == "ollama"


# 8. Concrete AI Providers Unit Tests
@pytest.mark.anyio
async def test_gemini_provider_generate():
    from app.ai.exceptions import AIProviderError
    from app.ai.providers.gemini import GeminiProvider

    mock_res = MagicMock()
    mock_res.status_code = 200
    mock_res.json = MagicMock(
        return_value={
            "candidates": [{"content": {"parts": [{"text": "Gemini text"}]}}],
            "usageMetadata": {
                "promptTokenCount": 10,
                "candidatesTokenCount": 5,
                "totalTokenCount": 15,
            },
        }
    )
    mock_res.headers = {}

    with patch("httpx.AsyncClient.post", return_value=mock_res):
        provider = GeminiProvider()
        provider.api_key = "dummy_key"
        res = await provider.generate_reflection("some text")
        assert res.content == "Gemini text"
        assert res.token_usage.total_tokens == 15
        assert res.provider == "gemini"

        # Check health
        health = await provider.health()
        assert health.healthy is True

        # Check audio error
        with pytest.raises(AIProviderError):
            await provider.analyze_audio("ref")


@pytest.mark.anyio
async def test_openai_provider_generate():
    from app.ai.providers.openai import OpenAIProvider

    mock_res = MagicMock()
    mock_res.status_code = 200
    mock_res.json = MagicMock(
        return_value={
            "choices": [{"message": {"content": "OpenAI text"}}],
            "usage": {"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15},
        }
    )
    mock_res.headers = {"x-request-id": "req-openai"}

    with patch("httpx.AsyncClient.post", return_value=mock_res):
        provider = OpenAIProvider()
        provider.api_key = "dummy_key"
        res = await provider.analyze_text("some text")
        assert res.content == "OpenAI text"
        assert res.token_usage.total_tokens == 15
        assert res.provider == "openai"


@pytest.mark.anyio
async def test_anthropic_provider_generate():
    from app.ai.providers.anthropic import AnthropicProvider

    mock_res = MagicMock()
    mock_res.status_code = 200
    mock_res.json = MagicMock(
        return_value={
            "content": [{"type": "text", "text": "Anthropic text"}],
            "usage": {"input_tokens": 10, "output_tokens": 5},
            "id": "anth-id",
        }
    )
    mock_res.headers = {"request-id": "req-anth"}

    with patch("httpx.AsyncClient.post", return_value=mock_res):
        provider = AnthropicProvider()
        provider.api_key = "dummy_key"
        res = await provider.summarize("some text")
        assert res.content == "Anthropic text"
        assert res.token_usage.total_tokens == 15
        assert res.provider == "claude"


@pytest.mark.anyio
async def test_groq_provider_generate():
    from app.ai.providers.groq import GroqProvider

    mock_res = MagicMock()
    mock_res.status_code = 200
    mock_res.json = MagicMock(
        return_value={
            "choices": [{"message": {"content": "Groq text"}}],
            "usage": {"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15},
        }
    )
    mock_res.headers = {"x-request-id": "req-groq"}

    with patch("httpx.AsyncClient.post", return_value=mock_res):
        provider = GroqProvider()
        provider.api_key = "dummy_key"
        res = await provider.analyze_text("some text")
        assert res.content == "Groq text"
        assert res.provider == "groq"


@pytest.mark.anyio
async def test_ollama_provider_generate():
    from app.ai.providers.ollama import OllamaProvider

    mock_res = MagicMock()
    mock_res.status_code = 200
    mock_res.json = MagicMock(return_value={"message": {"content": "Ollama text"}})
    mock_res.headers = {}

    with patch("httpx.AsyncClient.post", return_value=mock_res):
        provider = OllamaProvider()
        res = await provider.analyze_text("some text")
        assert res.content == "Ollama text"
        assert res.provider == "ollama"


# 9. Additional Circuit Breaker and Reliable Wrapper Coverage Tests
@pytest.mark.anyio
async def test_circuit_breaker_half_open():
    import time

    cb = CircuitBreaker(failure_threshold=2, recovery_timeout_seconds=0.01)
    cb.record_failure()
    cb.record_failure()
    assert not cb.can_execute()
    time.sleep(0.02)
    assert cb.can_execute()
    assert cb.state == "HALF-OPEN"
    cb.record_success()
    assert cb.state == "CLOSED"


@pytest.mark.anyio
async def test_compute_estimated_cost_edge_cases():
    from app.ai.providers.reliable import compute_estimated_cost
    from app.ai.types import TokenUsage

    # None usage
    assert compute_estimated_cost("gemini", "gemini-1.5-flash", None) is None
    # None input/output tokens
    assert (
        compute_estimated_cost(
            "gemini",
            "gemini-1.5-flash",
            TokenUsage(input_tokens=None, output_tokens=None, total_tokens=None),
        )
        is None
    )
    # Unknown model fallback pricing
    cost = compute_estimated_cost("openai", "unknown-model", TokenUsage(1000, 1000, 2000))
    assert cost == (1000 * (0.15 / 1000000)) + (1000 * (0.60 / 1000000))
    # Unknown provider
    assert compute_estimated_cost("unknown-prov", "model", TokenUsage(10, 10, 20)) == 0.0


@pytest.mark.anyio
async def test_reliable_provider_health_fallback():
    from app.ai.providers.reliable import ReliableAIProviderWrapper

    wrapper = ReliableAIProviderWrapper(primary_provider_name="nonexistent")
    health = await wrapper.health()
    assert health.healthy is False
    assert "Builder not found" in health.error


@pytest.mark.anyio
async def test_reliable_provider_execute_timeout_retry():
    import asyncio

    from app.ai.exceptions import AIProviderError
    from app.ai.providers.reliable import ReliableAIProviderWrapper

    mock_prov = MagicMock()
    mock_prov.analyze_text = AsyncMock(side_effect=asyncio.TimeoutError())

    wrapper = ReliableAIProviderWrapper(primary_provider_name="gemini")
    wrapper.get_provider_builder = lambda name: lambda: mock_prov

    with patch("app.ai.providers.reliable.get_provider_priority_list", return_value=["gemini"]):
        with patch("app.core.config.settings.ai_timeout", 0.01):
            with pytest.raises(AIProviderError):
                await wrapper.analyze_text("some text")


@pytest.mark.anyio
async def test_reliable_provider_execute_exception_retry():
    from app.ai.exceptions import AIProviderError
    from app.ai.providers.reliable import ReliableAIProviderWrapper

    mock_prov = MagicMock()
    mock_prov.analyze_text = AsyncMock(side_effect=Exception("API Error"))

    wrapper = ReliableAIProviderWrapper(primary_provider_name="gemini")
    wrapper.get_provider_builder = lambda name: lambda: mock_prov

    with patch("app.ai.providers.reliable.get_provider_priority_list", return_value=["gemini"]):
        with pytest.raises(AIProviderError):
            await wrapper.analyze_text("some text")
