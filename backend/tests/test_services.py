from datetime import datetime
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from app.ai.types import AIResponse, TokenUsage
from app.models.analysis import MoodAnalysis
from app.models.assistant import AssistantMessage
from app.models.journal import JournalEntry
from app.rag.prompt_builder import DefaultRAGPromptBuilder
from app.rag.retriever import (
    SqlCompositeRetriever,
    SqlConversationRetriever,
    SqlJournalRetriever,
    SqlMoodRetriever,
    SqlReflectionRetriever,
)
from app.rag.types import ContextWindow, RAGDocument, RetrievalSource, SearchQuery, SearchResult
from app.schemas.enums import AnalysisStatus, AssistantRole, JournalSource, RiskLevel
from app.services.emotion.gemini import GeminiEmotionAnalysisService
from app.services.emotion.types import EmotionInput
from app.services.reflection.gemini import GeminiReflectionGenerationService
from app.services.reflection.types import ReflectionInput
from app.services.safety.gemini import GeminiSafetyScreeningService
from app.services.safety.types import SafetyCategory, SafetyInput


# 1. Safety Service Unit Tests
@pytest.mark.anyio
async def test_safety_service_success():
    provider = MagicMock()
    provider.analyze_text = AsyncMock(
        return_value=AIResponse(
            content='{"risk_level": "low", "categories": ["none"], "requires_escalation": false, "rationale": "Patient is calm"}',
            provider="gemini",
            model="gemini-1.5-flash",
            latency_ms=10,
            request_id="req-1",
            token_usage=TokenUsage(5, 5, 10),
        )
    )
    service = GeminiSafetyScreeningService(provider)
    payload = SafetyInput(text="I am feeling okay today.")
    result = await service.screen(payload)

    assert result.risk_level == RiskLevel.LOW
    assert SafetyCategory.NONE in result.categories
    assert not result.requires_escalation
    assert result.rationale == "Patient is calm"


@pytest.mark.anyio
async def test_safety_service_invalid_json_retry():
    provider = MagicMock()
    # First call returns invalid JSON, second call returns valid JSON
    provider.analyze_text = AsyncMock(
        side_effect=[
            AIResponse(
                content='{"risk_level": "invalid",',
                provider="gemini",
                model="gemini-1.5-flash",
                latency_ms=10,
                request_id="req-2",
                token_usage=TokenUsage(0, 0, 0),
            ),
            AIResponse(
                content='{"risk_level": "moderate", "categories": ["self_harm"], "requires_escalation": true, "rationale": "Self-harm detected"}',
                provider="gemini",
                model="gemini-1.5-flash",
                latency_ms=10,
                request_id="req-3",
                token_usage=TokenUsage(5, 5, 10),
            ),
        ]
    )
    service = GeminiSafetyScreeningService(provider)
    payload = SafetyInput(text="I hurt myself.")
    result = await service.screen(payload)

    assert result.risk_level == RiskLevel.MODERATE
    assert SafetyCategory.SELF_HARM in result.categories
    assert result.requires_escalation


# 2. Emotion Service Unit Tests
@pytest.mark.anyio
async def test_emotion_service_success():
    provider = MagicMock()
    provider.analyze_text = AsyncMock(
        return_value=AIResponse(
            content='{"primary_mood": "sadness", "confidence": 0.85, "emotions": [{"label": "sadness", "score": 0.85}, {"label": "anxiety", "score": 0.15}]}',
            provider="gemini",
            model="gemini-1.5-flash",
            latency_ms=10,
            request_id="req-4",
            token_usage=TokenUsage(5, 5, 10),
        )
    )
    service = GeminiEmotionAnalysisService(provider)
    payload = EmotionInput(text="It was a gloomy day.")
    result = await service.analyze(payload)

    assert result.primary_mood == "sadness"
    assert result.confidence == 0.85
    assert len(result.emotions) == 2
    assert result.emotions[0].label == "sadness"
    assert result.emotions[0].score == 0.85


# 3. Reflection Service Unit Tests
@pytest.mark.anyio
async def test_reflection_service_success():
    provider = MagicMock()
    provider.generate_reflection = AsyncMock(
        return_value=AIResponse(
            content='{"summary": "A sad day", "themes": ["gloomy"], "reflection": "I hear your sadness", "suggestions": ["Drink water"], "follow_up_questions": ["What happened?"]}',
            provider="gemini",
            model="gemini-1.5-flash",
            latency_ms=15,
            request_id="req-5",
            token_usage=TokenUsage(10, 10, 20),
        )
    )
    service = GeminiReflectionGenerationService(provider)
    payload = ReflectionInput(text="I am sad.", primary_mood="sadness", risk_level="low")
    result = await service.generate(payload)

    assert result.summary == "A sad day"
    assert "gloomy" in result.themes
    assert result.reflection == "I hear your sadness"
    assert "Drink water" in result.suggestions
    assert "What happened?" in result.follow_up_questions


# 4. Prompt Builder Unit Test
@pytest.mark.anyio
async def test_prompt_builder():
    builder = DefaultRAGPromptBuilder()
    doc1 = RAGDocument(
        id="doc-1",
        source=RetrievalSource.JOURNAL,
        text="Journal content",
        user_id=uuid4(),
        created_at=datetime(2026, 8, 1, 12, 0),
    )
    doc2 = RAGDocument(
        id="doc-2",
        source=RetrievalSource.REFLECTION,
        text="Reflection content",
        user_id=uuid4(),
        created_at=datetime(2026, 8, 1, 13, 0),
    )
    context = ContextWindow(
        question="How am I doing?",
        documents=(
            SearchResult(document=doc1, score=0.9),
            SearchResult(document=doc2, score=0.8),
        ),
        memories=(),
        token_budget=100,
    )
    built = await builder.build(context)

    assert "MindCare AI" in built.system_prompt
    assert "Relevant Past Journal Entries" in built.user_prompt
    assert "Journal content" in built.user_prompt
    assert "Past AI Reflections" in built.user_prompt
    assert "Reflection content" in built.user_prompt
    assert "How am I doing?" in built.user_prompt


# 5. RAG Retriever Unit Tests
@pytest.mark.anyio
async def test_sql_journal_retriever(db_session):
    # Insert a dummy journal entry
    user_id = uuid4()
    entry = JournalEntry(
        id=uuid4(),
        user_id=user_id,
        title="Test Entry",
        content="I feel anxious.",
        source=JournalSource.MANUAL,
    )
    db_session.add(entry)
    await db_session.commit()

    retriever = SqlJournalRetriever(db_session)
    query = SearchQuery(user_id=user_id, text="anxious", limit=5)
    results = await retriever.retrieve(query)

    assert len(results) == 1
    assert results[0].document.text == "I feel anxious."
    assert results[0].document.metadata["title"] == "Test Entry"


@pytest.mark.anyio
async def test_sql_reflection_retriever(db_session):
    user_id = uuid4()
    # Insert completed analysis containing reflection details
    analysis = MoodAnalysis(
        id=uuid4(),
        user_id=user_id,
        input_type="text",
        status=AnalysisStatus.COMPLETED,
        provider_metadata={
            "summary": "Summary text",
            "reflection": "Reflection text",
            "themes": ["anxiety"],
            "suggestions": ["breathe"],
        },
    )
    db_session.add(analysis)
    await db_session.commit()

    retriever = SqlReflectionRetriever(db_session)
    query = SearchQuery(user_id=user_id, text="reflection", limit=5)
    results = await retriever.retrieve(query)

    assert len(results) == 1
    assert results[0].document.text == "Reflection text"
    assert results[0].document.metadata["summary"] == "Summary text"


@pytest.mark.anyio
async def test_sql_mood_retriever(db_session):
    user_id = uuid4()
    analysis = MoodAnalysis(
        id=uuid4(),
        user_id=user_id,
        input_type="text",
        status=AnalysisStatus.COMPLETED,
        primary_mood="sadness",
        confidence=0.8,
        risk_level=RiskLevel.LOW,
    )
    db_session.add(analysis)
    await db_session.commit()

    retriever = SqlMoodRetriever(db_session)
    query = SearchQuery(user_id=user_id, text="mood", limit=5)
    results = await retriever.retrieve(query)

    assert len(results) == 1
    assert "sadness" in results[0].document.text
    assert results[0].document.metadata["primary_mood"] == "sadness"


@pytest.mark.anyio
async def test_sql_conversation_retriever(db_session):
    conversation_id = uuid4()
    msg = AssistantMessage(
        id=uuid4(),
        conversation_id=conversation_id,
        role=AssistantRole.USER,
        content="Hello helper",
    )
    db_session.add(msg)
    await db_session.commit()

    retriever = SqlConversationRetriever(db_session)
    query = SearchQuery(
        user_id=uuid4(),
        text="chat",
        metadata_filter={"conversation_id": str(conversation_id)},
    )
    results = await retriever.retrieve(query)

    assert len(results) == 1
    assert "User: Hello helper" in results[0].document.text


@pytest.mark.anyio
async def test_composite_retriever_fallback(db_session):
    # Setup child retrievers
    user_id = uuid4()
    entry = JournalEntry(
        id=uuid4(),
        user_id=user_id,
        title="Journal",
        content="Composite text",
        source=JournalSource.MANUAL,
    )
    db_session.add(entry)
    await db_session.commit()

    j_ret = SqlJournalRetriever(db_session)
    # Composite setup without semantic search should fall back to DB
    composite = SqlCompositeRetriever(retrievers=[j_ret], semantic_search=None)
    query = SearchQuery(user_id=user_id, text="composite", limit=5)
    results = await composite.retrieve(query)

    assert len(results) == 1
    assert results[0].document.text == "Composite text"


@pytest.mark.anyio
async def test_composite_retriever_semantic_success():
    mock_sem = MagicMock()
    mock_sem.search = AsyncMock(
        return_value=[
            SearchResult(
                score=0.95,
                document=RAGDocument(
                    id="sem-1",
                    source=RetrievalSource.JOURNAL,
                    text="Semantic text",
                    user_id=uuid4(),
                ),
            )
        ]
    )
    composite = SqlCompositeRetriever(retrievers=[], semantic_search=mock_sem)
    query = SearchQuery(user_id=uuid4(), text="hello")
    results = await composite.retrieve(query)
    assert len(results) == 1
    assert results[0].document.text == "Semantic text"


@pytest.mark.anyio
async def test_composite_retriever_semantic_failure_fallback(db_session):
    user_id = uuid4()
    entry = JournalEntry(
        id=uuid4(),
        user_id=user_id,
        title="Journal",
        content="Fallback text",
        source=JournalSource.MANUAL,
    )
    db_session.add(entry)
    await db_session.commit()

    j_ret = SqlJournalRetriever(db_session)
    mock_sem = MagicMock()
    mock_sem.search = AsyncMock(side_effect=ValueError("connection refused"))
    composite = SqlCompositeRetriever(retrievers=[j_ret], semantic_search=mock_sem)
    query = SearchQuery(user_id=user_id, text="fallback")
    results = await composite.retrieve(query)
    assert len(results) == 1
    assert results[0].document.text == "Fallback text"


@pytest.mark.anyio
async def test_composite_retriever_no_matching_sources():
    j_ret = SqlJournalRetriever(None)
    composite = SqlCompositeRetriever(retrievers=[j_ret], semantic_search=None)
    query = SearchQuery(user_id=uuid4(), text="query", sources=[RetrievalSource.MOOD])
    results = await composite.retrieve(query)
    assert results == []


@pytest.mark.anyio
async def test_pipeline_orchestrator():
    from app.services.emotion.types import EmotionResult, EmotionSignal
    from app.services.orchestration.gemini import GeminiAIPipelineOrchestrator
    from app.services.orchestration.types import PipelineStage
    from app.services.reflection.types import ReflectionResult
    from app.services.safety.types import SafetyResult

    # Mock safety screen
    mock_safety = MagicMock()
    mock_safety.screen = AsyncMock(
        return_value=SafetyResult(
            risk_level=RiskLevel.LOW,
            categories=["none"],
            requires_escalation=False,
            rationale="calm",
        )
    )

    # Mock emotion analyze
    mock_emotion = MagicMock()
    mock_emotion.analyze = AsyncMock(
        return_value=EmotionResult(
            primary_mood="joy",
            confidence=0.9,
            emotions=[EmotionSignal(label="joy", score=0.9)],
        )
    )

    # Mock reflection generate
    mock_reflection = MagicMock()
    mock_reflection.generate = AsyncMock(
        return_value=ReflectionResult(
            summary="Joyful summary",
            themes=["happiness"],
            reflection="That is great reflection!",
            suggestions=["Keep smiling"],
            follow_up_questions=["Why so happy?"],
        )
    )

    orchestrator = GeminiAIPipelineOrchestrator(
        safety=mock_safety, emotion=mock_emotion, reflection=mock_reflection
    )

    input_payload = {
        "text": "Today was a fantastic day!",
        "journal_id": uuid4(),
        "analysis_id": uuid4(),
        "user_id": uuid4(),
    }

    result = await orchestrator.run(input_payload)

    assert result.analysis_id == str(input_payload["analysis_id"])
    assert len(result.completed_stages) > 0
    assert PipelineStage.REFLECTION_GENERATION in result.completed_stages
