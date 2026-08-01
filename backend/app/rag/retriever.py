from abc import ABC, abstractmethod

from app.rag.types import RetrievalSource, SearchQuery, SearchResult


class Retriever(ABC):
    source: RetrievalSource

    @abstractmethod
    async def retrieve(self, query: SearchQuery) -> list[SearchResult]:
        """Retrieve relevant results for one source."""


class JournalRetriever(Retriever):
    source = RetrievalSource.JOURNAL


class ReflectionRetriever(Retriever):
    source = RetrievalSource.REFLECTION


class MoodRetriever(Retriever):
    source = RetrievalSource.MOOD


class ConversationRetriever(Retriever):
    source = RetrievalSource.CONVERSATION


class CompositeRetriever(ABC):
    @abstractmethod
    async def retrieve(self, query: SearchQuery) -> list[SearchResult]:
        """Retrieve across configured source retrievers."""
