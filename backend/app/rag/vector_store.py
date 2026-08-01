from abc import ABC, abstractmethod
import math

from app.rag.types import SearchQuery, SearchResult, VectorRecord


class VectorStore(ABC):
    name: str

    @abstractmethod
    async def upsert(self, records: list[VectorRecord]) -> None:
        """Persist vector records."""

    @abstractmethod
    async def search(self, query: SearchQuery, *, vector: list[float]) -> list[SearchResult]:
        """Search semantically similar records for a query vector."""

    @abstractmethod
    async def delete(self, ids: list[str], *, namespace: str | None = None) -> None:
        """Delete vector records by id."""


class SemanticSearchService(ABC):
    @abstractmethod
    async def search(self, query: SearchQuery) -> list[SearchResult]:
        """Embed the query and search the configured vector store."""


class DefaultSemanticSearchService(SemanticSearchService):
    def __init__(self, embedding_provider: "EmbeddingProvider", vector_store: VectorStore) -> None:
        self.embedding_provider = embedding_provider
        self.vector_store = vector_store

    async def search(self, query: SearchQuery) -> list[SearchResult]:
        from app.rag.types import EmbeddingRequest

        req = EmbeddingRequest(text=query.text)
        res = await self.embedding_provider.embed_text(req)
        return await self.vector_store.search(query, vector=res.vector)


# Module-level thread-safe mock storage for local runtime
_in_memory_records: dict[str, VectorRecord] = {}


def cosine_similarity(v1: list[float], v2: list[float]) -> float:
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    norm_a = math.sqrt(sum(a * a for a in v1))
    norm_b = math.sqrt(sum(b * b for b in v2))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot / (norm_a * norm_b)


class InMemoryVectorStore(VectorStore):
    name = "in_memory"

    async def upsert(self, records: list[VectorRecord]) -> None:
        for r in records:
            _in_memory_records[r.id] = r

    async def search(self, query: SearchQuery, *, vector: list[float]) -> list[SearchResult]:
        results = []
        for r in _in_memory_records.values():
            # Apply user_id filter
            if query.user_id and r.document.user_id != query.user_id:
                continue
            # Apply namespace filter
            if query.namespace and r.namespace != query.namespace:
                continue
            # Apply sources filter
            if query.sources and r.document.source not in query.sources:
                continue

            similarity = cosine_similarity(vector, r.vector)
            if query.min_score is not None and similarity < query.min_score:
                continue

            results.append(
                SearchResult(
                    document=r.document,
                    score=similarity,
                    vector_store=self.name,
                )
            )

        # Sort by similarity descending
        results.sort(key=lambda x: x.score, reverse=True)
        return results[: query.limit]

    async def delete(self, ids: list[str], *, namespace: str | None = None) -> None:
        for record_id in ids:
            _in_memory_records.pop(record_id, None)


class PgvectorVectorStore(VectorStore):
    name = "pgvector"

    def __init__(self, connection_string: str | None = None) -> None:
        self.connection_string = connection_string

    async def upsert(self, records: list[VectorRecord]) -> None:
        pass

    async def search(self, query: SearchQuery, *, vector: list[float]) -> list[SearchResult]:
        return []

    async def delete(self, ids: list[str], *, namespace: str | None = None) -> None:
        pass


class PineconeVectorStore(VectorStore):
    name = "pinecone"

    def __init__(self, api_key: str | None = None, index_name: str | None = None) -> None:
        self.api_key = api_key
        self.index_name = index_name

    async def upsert(self, records: list[VectorRecord]) -> None:
        pass

    async def search(self, query: SearchQuery, *, vector: list[float]) -> list[SearchResult]:
        return []

    async def delete(self, ids: list[str], *, namespace: str | None = None) -> None:
        pass


class QdrantVectorStore(VectorStore):
    name = "qdrant"

    def __init__(self, url: str | None = None, api_key: str | None = None) -> None:
        self.url = url
        self.api_key = api_key

    async def upsert(self, records: list[VectorRecord]) -> None:
        pass

    async def search(self, query: SearchQuery, *, vector: list[float]) -> list[SearchResult]:
        return []

    async def delete(self, ids: list[str], *, namespace: str | None = None) -> None:
        pass


class ChromaVectorStore(VectorStore):
    name = "chroma"

    def __init__(self, path: str | None = None) -> None:
        self.path = path

    async def upsert(self, records: list[VectorRecord]) -> None:
        pass

    async def search(self, query: SearchQuery, *, vector: list[float]) -> list[SearchResult]:
        return []

    async def delete(self, ids: list[str], *, namespace: str | None = None) -> None:
        pass
