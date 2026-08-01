from abc import ABC, abstractmethod

from app.rag.types import ContextWindow, MemoryItem, SearchQuery, SearchResult


class ContextWindowBuilder(ABC):
    @abstractmethod
    async def build(
        self,
        query: SearchQuery,
        *,
        memories: list[MemoryItem],
        documents: list[SearchResult],
        token_budget: int | None = None,
    ) -> ContextWindow:
        """Build a bounded context window for prompt construction."""
