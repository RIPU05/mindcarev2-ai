from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai import get_ai_provider
from app.ai.providers.base import AIProvider
from app.core.config import settings
from app.rag.context_manager import ContextWindowBuilder
from app.rag.embeddings import EmbeddingProvider
from app.rag.memory import ConversationMemory, LongTermMemory, MemorySummarizer
from app.rag.prompt_builder import RAGPromptBuilder
from app.rag.retriever import CompositeRetriever
from app.rag.vector_store import InMemoryVectorStore, SemanticSearchService, VectorStore


@dataclass(frozen=True)
class RAGComponentBundle:
    ai_provider: AIProvider
    embedding_provider: EmbeddingProvider | None = None
    vector_store: VectorStore | None = None
    semantic_search: SemanticSearchService | None = None
    retriever: CompositeRetriever | None = None
    conversation_memory: ConversationMemory | None = None
    long_term_memory: LongTermMemory | None = None
    memory_summarizer: MemorySummarizer | None = None
    context_builder: ContextWindowBuilder | None = None
    prompt_builder: RAGPromptBuilder | None = None


def get_embedding_provider(provider_name: str | None = None) -> EmbeddingProvider:
    provider = (provider_name or settings.default_ai_provider).lower()
    if provider == "openai":
        from app.rag.embeddings import OpenAIEmbeddingProvider

        return OpenAIEmbeddingProvider()
    elif provider == "ollama":
        from app.rag.embeddings import OllamaEmbeddingProvider

        return OllamaEmbeddingProvider()
    else:
        from app.rag.embeddings import GeminiEmbeddingProvider

        return GeminiEmbeddingProvider()


_global_vector_store = InMemoryVectorStore()


def get_rag_components(session: AsyncSession | None = None) -> RAGComponentBundle:
    ai_provider = get_ai_provider()
    embedding_provider = get_embedding_provider()
    vector_store = _global_vector_store

    from app.rag.vector_store import DefaultSemanticSearchService

    semantic_search = DefaultSemanticSearchService(embedding_provider, vector_store)

    if session is not None:
        from app.rag.context_manager import DefaultContextWindowBuilder
        from app.rag.prompt_builder import DefaultRAGPromptBuilder
        from app.rag.retriever import (
            SqlCompositeRetriever,
            SqlConversationRetriever,
            SqlJournalRetriever,
            SqlMoodRetriever,
            SqlReflectionRetriever,
        )

        jr = SqlJournalRetriever(session)
        rr = SqlReflectionRetriever(session)
        mr = SqlMoodRetriever(session)
        cr = SqlConversationRetriever(session)

        retriever = SqlCompositeRetriever([jr, rr, mr, cr], semantic_search=semantic_search)
        context_builder = DefaultContextWindowBuilder()
        prompt_builder = DefaultRAGPromptBuilder()

        return RAGComponentBundle(
            ai_provider=ai_provider,
            embedding_provider=embedding_provider,
            vector_store=vector_store,
            semantic_search=semantic_search,
            retriever=retriever,
            context_builder=context_builder,
            prompt_builder=prompt_builder,
        )

    return RAGComponentBundle(
        ai_provider=ai_provider,
        embedding_provider=embedding_provider,
        vector_store=vector_store,
        semantic_search=semantic_search,
    )
