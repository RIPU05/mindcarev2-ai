from dataclasses import dataclass

from app.ai import get_ai_provider
from app.ai.providers.base import AIProvider
from app.rag.context_manager import ContextWindowBuilder
from app.rag.embeddings import EmbeddingProvider
from app.rag.memory import ConversationMemory, LongTermMemory, MemorySummarizer
from app.rag.prompt_builder import RAGPromptBuilder
from app.rag.retriever import CompositeRetriever
from app.rag.vector_store import SemanticSearchService, VectorStore


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


def get_rag_components() -> RAGComponentBundle:
    return RAGComponentBundle(ai_provider=get_ai_provider())
