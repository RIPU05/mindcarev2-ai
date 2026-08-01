from dataclasses import dataclass, field
from datetime import datetime
from enum import StrEnum
from typing import Any
from uuid import UUID


class EmbeddingProviderName(StrEnum):
    GEMINI = "gemini"
    OPENAI = "openai"
    VOYAGE = "voyage"
    OLLAMA = "ollama"


class VectorStoreName(StrEnum):
    PGVECTOR = "pgvector"
    PINECONE = "pinecone"
    QDRANT = "qdrant"
    CHROMA = "chroma"


class MemoryScope(StrEnum):
    SHORT_TERM = "short_term"
    LONG_TERM = "long_term"


class RetrievalSource(StrEnum):
    JOURNAL = "journal"
    REFLECTION = "reflection"
    MOOD = "mood"
    CONVERSATION = "conversation"
    MEMORY = "memory"


@dataclass(frozen=True)
class EmbeddingRequest:
    text: str
    provider: EmbeddingProviderName | str | None = None
    model: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class EmbeddingResult:
    vector: list[float]
    provider: str
    model: str
    dimensions: int
    token_usage: dict[str, int | None] = field(default_factory=dict)
    request_id: str | None = None


@dataclass(frozen=True)
class RAGDocument:
    id: str
    source: RetrievalSource
    text: str
    user_id: UUID | None = None
    created_at: datetime | None = None
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class VectorRecord:
    id: str
    vector: list[float]
    document: RAGDocument
    namespace: str | None = None


@dataclass(frozen=True)
class SearchQuery:
    text: str
    user_id: UUID | None = None
    sources: tuple[RetrievalSource, ...] = ()
    namespace: str | None = None
    limit: int = 8
    min_score: float | None = None
    metadata_filter: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class SearchResult:
    document: RAGDocument
    score: float
    vector_store: str | None = None


@dataclass(frozen=True)
class MemoryItem:
    id: str
    scope: MemoryScope
    text: str
    user_id: UUID | None = None
    source_ids: tuple[str, ...] = ()
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class ContextWindow:
    question: str
    memories: tuple[MemoryItem, ...] = ()
    documents: tuple[SearchResult, ...] = ()
    token_budget: int | None = None
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class BuiltPrompt:
    system_prompt: str
    user_prompt: str
    context: ContextWindow
    metadata: dict[str, Any] = field(default_factory=dict)
