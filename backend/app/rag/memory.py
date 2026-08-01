from abc import ABC, abstractmethod
from uuid import UUID

from app.rag.types import MemoryItem, MemoryScope, SearchQuery


class ConversationMemory(ABC):
    @abstractmethod
    async def append(self, item: MemoryItem) -> None:
        """Append a short-term conversation memory item."""

    @abstractmethod
    async def list_recent(self, user_id: UUID, *, limit: int = 12) -> list[MemoryItem]:
        """Return recent short-term conversation memory."""


class LongTermMemory(ABC):
    @abstractmethod
    async def store(self, item: MemoryItem) -> None:
        """Persist a long-term memory item."""

    @abstractmethod
    async def search(self, query: SearchQuery) -> list[MemoryItem]:
        """Retrieve relevant long-term memories."""


class MemorySummarizer(ABC):
    @abstractmethod
    async def summarize(self, items: list[MemoryItem], *, scope: MemoryScope) -> MemoryItem:
        """Summarize memory items into a compact memory representation."""
