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


class DefaultContextWindowBuilder(ContextWindowBuilder):
    def __init__(self, default_token_limit: int = 8000) -> None:
        self.default_token_limit = default_token_limit

    async def build(
        self,
        query: SearchQuery,
        *,
        memories: list[MemoryItem],
        documents: list[SearchResult],
        token_budget: int | None = None,
    ) -> ContextWindow:
        limit = token_budget or self.default_token_limit

        def estimate_tokens(text: str) -> int:
            return max(1, len(text) // 4)

        current_tokens = estimate_tokens(query.text)
        selected_memories = []
        selected_documents = []

        # Budget memory items
        for mem in memories:
            tokens = estimate_tokens(mem.text)
            if current_tokens + tokens <= limit:
                selected_memories.append(mem)
                current_tokens += tokens
            else:
                break

        # Budget retrieved items
        for doc in documents:
            tokens = estimate_tokens(doc.document.text)
            if current_tokens + tokens <= limit:
                selected_documents.append(doc)
                current_tokens += tokens
            else:
                break

        import logging

        logger = logging.getLogger(__name__)
        logger.info(
            f"RAG Context Window: query_tokens={estimate_tokens(query.text)}, "
            f"memories={len(selected_memories)}, documents={len(selected_documents)}, "
            f"tokens={current_tokens}, limit={limit}"
        )

        return ContextWindow(
            question=query.text,
            memories=tuple(selected_memories),
            documents=tuple(selected_documents),
            token_budget=limit,
            metadata={"estimated_tokens": current_tokens},
        )
