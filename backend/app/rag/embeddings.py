import asyncio
import logging
from abc import ABC, abstractmethod
from typing import Any

import httpx

from app.core.config import settings
from app.rag.types import EmbeddingRequest, EmbeddingResult

logger = logging.getLogger(__name__)


class EmbeddingProvider(ABC):
    name: str
    model: str

    @abstractmethod
    async def embed_text(self, request: EmbeddingRequest) -> EmbeddingResult:
        """Embed a single text input."""

    @abstractmethod
    async def embed_batch(self, requests: list[EmbeddingRequest]) -> list[EmbeddingResult]:
        """Embed multiple text inputs using the same provider."""


class EmbeddingCache(ABC):
    @abstractmethod
    async def get(self, text: str) -> list[float] | None:
        """Retrieve cached embedding."""

    @abstractmethod
    async def set(self, text: str, vector: list[float]) -> None:
        """Cache embedding."""


class InMemoryEmbeddingCache(EmbeddingCache):
    def __init__(self) -> None:
        self._cache: dict[str, list[float]] = {}

    async def get(self, text: str) -> list[float] | None:
        return self._cache.get(text)

    async def set(self, text: str, vector: list[float]) -> None:
        self._cache[text] = vector


_global_cache = InMemoryEmbeddingCache()


def chunk_text(text: str, max_chars: int = 1000, overlap: int = 200) -> list[str]:
    chunks = []
    if len(text) <= max_chars:
        return [text]
    start = 0
    while start < len(text):
        end = start + max_chars
        chunks.append(text[start:end])
        start += max_chars - overlap
    return chunks


async def retry_async(func, max_retries: int = 3, initial_delay: float = 0.5):
    last_exc = None
    for attempt in range(max_retries):
        try:
            return await func()
        except Exception as exc:
            last_exc = exc
            logger.warning(
                f"Embedding call failed on attempt {attempt + 1}. Retrying... Error: {exc}"
            )
            await asyncio.sleep(initial_delay * (2**attempt))
    if last_exc is not None:
        raise last_exc
    raise RuntimeError("Execution failed after retries.")


class GeminiEmbeddingProvider(EmbeddingProvider):
    name = "gemini"
    model = "text-embedding-004"

    async def embed_text(self, request: EmbeddingRequest) -> EmbeddingResult:
        results = await self.embed_batch([request])
        return results[0]

    async def embed_batch(self, requests: list[EmbeddingRequest]) -> list[EmbeddingResult]:
        api_key = settings.gemini_api_key
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:batchEmbedContents"

        payload = {
            "requests": [
                {
                    "model": f"models/{self.model}",
                    "content": {"parts": [{"text": req.text}]},
                }
                for req in requests
            ]
        }

        async def _call():
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, params={"key": api_key}, json=payload)
                res.raise_for_status()
                return res.json()

        data = await retry_async(_call)
        embeddings = data.get("embeddings") or []

        results = []
        for embed in embeddings:
            vector = [float(x) for x in embed.get("values", [])]
            results.append(
                EmbeddingResult(
                    vector=vector,
                    provider=self.name,
                    model=self.model,
                    dimensions=len(vector),
                    token_usage={"total_tokens": None},
                )
            )
        return results


class OpenAIEmbeddingProvider(EmbeddingProvider):
    name = "openai"
    model = "text-embedding-3-small"

    async def embed_text(self, request: EmbeddingRequest) -> EmbeddingResult:
        results = await self.embed_batch([request])
        return results[0]

    async def embed_batch(self, requests: list[EmbeddingRequest]) -> list[EmbeddingResult]:
        api_key = settings.openai_api_key
        url = "https://api.openai.com/v1/embeddings"

        payload = {
            "input": [req.text for req in requests],
            "model": self.model,
        }

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        async def _call():
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, headers=headers, json=payload)
                res.raise_for_status()
                return res.json()

        data = await retry_async(_call)
        records = data.get("data") or []
        usage = data.get("usage") or {}
        total_tokens = usage.get("total_tokens")

        results = []
        for rec in sorted(records, key=lambda x: x.get("index", 0)):
            vector = [float(x) for x in rec.get("embedding", [])]
            results.append(
                EmbeddingResult(
                    vector=vector,
                    provider=self.name,
                    model=self.model,
                    dimensions=len(vector),
                    token_usage={"total_tokens": total_tokens},
                )
            )
        return results


class OllamaEmbeddingProvider(EmbeddingProvider):
    name = "ollama"
    model = "nomic-embed-text"

    async def embed_text(self, request: EmbeddingRequest) -> EmbeddingResult:
        results = await self.embed_batch([request])
        return results[0]

    async def embed_batch(self, requests: list[EmbeddingRequest]) -> list[EmbeddingResult]:
        base_url = settings.ollama_base_url.rstrip("/")

        results = []
        async with httpx.AsyncClient(timeout=10.0) as client:
            for req in requests:

                async def _call(r=req):
                    res = await client.post(
                        f"{base_url}/api/embeddings",
                        json={"model": self.model, "prompt": r.text},
                    )
                    res.raise_for_status()
                    return res.json()

                data = await retry_async(_call)
                vector = [float(x) for x in data.get("embedding", [])]
                results.append(
                    EmbeddingResult(
                        vector=vector,
                        provider=self.name,
                        model=self.model,
                        dimensions=len(vector),
                        token_usage={"total_tokens": None},
                    )
                )
        return results


async def generate_and_store_embedding(
    text: str,
    source: Any,
    document_id: str,
    user_id: Any,
    metadata: dict[str, Any] | None = None,
) -> None:
    import time

    from app.core.metrics import EMBEDDING_GENERATION_DURATION_SECONDS
    from app.core.telemetry import tracer
    from app.rag.factory import get_rag_components
    from app.rag.types import EmbeddingRequest, RAGDocument, VectorRecord

    try:
        with tracer.start_as_current_span("generate_and_store_embedding") as span:
            span.set_attribute("embedding.source", str(source))
            span.set_attribute("embedding.doc_id", str(document_id))

            chunks = chunk_text(text)
            rag = get_rag_components()
            if not rag.embedding_provider or not rag.vector_store:
                logger.info("Embeddings or vector store not configured in get_rag_components")
                return

            records = []
            for index, chunk in enumerate(chunks):
                vector = await _global_cache.get(chunk)
                if not vector:
                    req = EmbeddingRequest(text=chunk)
                    started = time.perf_counter()
                    res = await rag.embedding_provider.embed_text(req)
                    EMBEDDING_GENERATION_DURATION_SECONDS.observe(time.perf_counter() - started)
                    vector = res.vector
                    await _global_cache.set(chunk, vector)

                doc = RAGDocument(
                    id=f"{document_id}_{index}",
                    source=source,
                    text=chunk,
                    user_id=user_id,
                    metadata=metadata or {},
                )
                records.append(
                    VectorRecord(
                        id=f"{document_id}_{index}",
                        vector=vector,
                        document=doc,
                    )
                )

        await rag.vector_store.upsert(records)
        logger.info(
            f"Stored {len(records)} chunks of embedding for source={source}, "
            f"doc_id={document_id}, user_id={user_id}"
        )
    except Exception as exc:
        logger.error(
            f"Failed to generate and store embedding: {exc}",
            exc_info=True,
        )
