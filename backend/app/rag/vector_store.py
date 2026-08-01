from abc import ABC, abstractmethod

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
