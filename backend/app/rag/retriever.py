from __future__ import annotations

from abc import ABC, abstractmethod
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.rag.types import RAGDocument, RetrievalSource, SearchQuery, SearchResult


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


class SqlJournalRetriever(JournalRetriever):
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def retrieve(self, query: SearchQuery) -> list[SearchResult]:
        if not query.user_id:
            return []
        from app.repositories.journal import JournalRepository
        from app.utils.pagination import PaginationParams

        repo = JournalRepository(self.session)
        limit = query.limit or 8
        pagination = PaginationParams(
            limit=limit, offset=0, sort_by="created_at", sort_direction="desc"
        )
        entries = await repo.list_for_user(query.user_id, pagination=pagination)
        results = []
        for i, entry in enumerate(entries):
            doc = RAGDocument(
                id=str(entry.id),
                source=RetrievalSource.JOURNAL,
                text=entry.content,
                user_id=query.user_id,
                created_at=entry.created_at,
                metadata={
                    "title": entry.title,
                    "tags": list(entry.tags or []),
                    "source": str(entry.source),
                },
            )
            score = 1.0 / (i + 1)
            results.append(SearchResult(document=doc, score=score))
        return results


class SqlReflectionRetriever(ReflectionRetriever):
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def retrieve(self, query: SearchQuery) -> list[SearchResult]:
        if not query.user_id:
            return []
        from app.repositories.analysis import MoodAnalysisRepository
        from app.schemas.enums import AnalysisStatus
        from app.utils.pagination import PaginationParams

        repo = MoodAnalysisRepository(self.session)
        limit = query.limit or 8
        pagination = PaginationParams(
            limit=limit, offset=0, sort_by="created_at", sort_direction="desc"
        )
        analyses = await repo.list_for_user(
            query.user_id,
            pagination=pagination,
            status=AnalysisStatus.COMPLETED,
        )
        results = []
        for i, analysis in enumerate(analyses):
            metadata = analysis.provider_metadata or {}
            reflection_text = metadata.get("reflection")
            if not reflection_text:
                continue
            doc = RAGDocument(
                id=str(analysis.id),
                source=RetrievalSource.REFLECTION,
                text=reflection_text,
                user_id=query.user_id,
                created_at=analysis.created_at,
                metadata={
                    "summary": metadata.get("summary"),
                    "themes": metadata.get("themes"),
                    "suggestions": metadata.get("suggestions"),
                },
            )
            score = 1.0 / (i + 1)
            results.append(SearchResult(document=doc, score=score))
        return results


class SqlMoodRetriever(MoodRetriever):
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def retrieve(self, query: SearchQuery) -> list[SearchResult]:
        if not query.user_id:
            return []
        from app.repositories.analysis import MoodAnalysisRepository
        from app.schemas.enums import AnalysisStatus
        from app.utils.pagination import PaginationParams

        repo = MoodAnalysisRepository(self.session)
        limit = query.limit or 8
        pagination = PaginationParams(
            limit=limit, offset=0, sort_by="created_at", sort_direction="desc"
        )
        analyses = await repo.list_for_user(
            query.user_id,
            pagination=pagination,
            status=AnalysisStatus.COMPLETED,
        )
        results = []
        for i, analysis in enumerate(analyses):
            mood_summary = (
                f"Primary Mood: {analysis.primary_mood} (confidence: {analysis.confidence:.2f}, "
                f"risk level: {analysis.risk_level})"
            )
            doc = RAGDocument(
                id=str(analysis.id),
                source=RetrievalSource.MOOD,
                text=mood_summary,
                user_id=query.user_id,
                created_at=analysis.created_at,
                metadata={
                    "primary_mood": analysis.primary_mood,
                    "confidence": analysis.confidence,
                    "risk_level": str(analysis.risk_level),
                    "emotion_scores": analysis.emotion_scores or {},
                },
            )
            score = 1.0 / (i + 1)
            results.append(SearchResult(document=doc, score=score))
        return results


class SqlConversationRetriever(ConversationRetriever):
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def retrieve(self, query: SearchQuery) -> list[SearchResult]:
        conversation_id = query.metadata_filter.get("conversation_id")
        if not conversation_id:
            return []
        from app.repositories.assistant import AssistantMessageRepository
        from app.utils.pagination import PaginationParams

        repo = AssistantMessageRepository(self.session)
        limit = query.limit or 10
        pagination = PaginationParams(
            limit=limit, offset=0, sort_by="created_at", sort_direction="desc"
        )
        messages = await repo.list_for_conversation(UUID(conversation_id), pagination=pagination)
        results = []
        for i, msg in enumerate(messages):
            role_prefix = "User" if msg.role == "user" else "Assistant"
            doc = RAGDocument(
                id=str(msg.id),
                source=RetrievalSource.CONVERSATION,
                text=f"{role_prefix}: {msg.content}",
                user_id=query.user_id,
                created_at=msg.created_at,
                metadata={"role": str(msg.role), "conversation_id": conversation_id},
            )
            score = 1.0 / (i + 1)
            results.append(SearchResult(document=doc, score=score))
        return results


class SqlCompositeRetriever(CompositeRetriever):
    def __init__(
        self, retrievers: list[Retriever], semantic_search: "SemanticSearchService" | None = None
    ) -> None:
        self.retrievers = retrievers
        self.semantic_search = semantic_search

    async def retrieve(self, query: SearchQuery) -> list[SearchResult]:
        import logging
        import time
        from app.core.telemetry import tracer
        from app.core.metrics import RAG_RETRIEVAL_DURATION_SECONDS

        logger = logging.getLogger(__name__)

        started = time.perf_counter()
        with tracer.start_as_current_span("rag_retrieve") as span:
            span.set_attribute("rag.query_text", query.text)

            if self.semantic_search is not None:
                try:
                    logger.info("Attempting semantic vector search via SemanticSearchService...")
                    results = await self.semantic_search.search(query)
                    if results:
                        logger.info(f"Semantic search returned {len(results)} matches.")
                        RAG_RETRIEVAL_DURATION_SECONDS.observe(time.perf_counter() - started)
                        return results
                except Exception as exc:
                    logger.warning(
                        f"Semantic search failed, falling back to chronological SQL: {exc}"
                    )

            import asyncio

            tasks = []
            for r in self.retrievers:
                if not query.sources or r.source in query.sources:
                    tasks.append(r.retrieve(query))

            if not tasks:
                RAG_RETRIEVAL_DURATION_SECONDS.observe(time.perf_counter() - started)
                return []

            retrieved_lists = await asyncio.gather(*tasks)
            results = []
            for sublist in retrieved_lists:
                results.extend(sublist)

            results.sort(key=lambda x: x.score, reverse=True)
            RAG_RETRIEVAL_DURATION_SECONDS.observe(time.perf_counter() - started)
            return results
