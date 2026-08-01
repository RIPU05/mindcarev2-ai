from datetime import UTC, datetime

from fastapi import APIRouter, Depends

from app.ai.exceptions import AIProviderError
from app.auth.dependencies import get_current_user
from app.db.uow import UnitOfWork
from app.exceptions import NotFoundException, ValidationException
from app.models.analysis import MoodAnalysis
from app.models.users import User
from app.repositories.analysis import MoodAnalysisRepository
from app.repositories.journal import JournalRepository
from app.schemas.analysis import (
    AudioAnalysisRequest,
    EmotionScore,
    MoodAnalysisResponse,
    TextAnalysisRequest,
)
from app.schemas.common import ErrorResponse
from app.schemas.enums import AnalysisInputType, AnalysisStatus, RiskLevel
from app.services.factory import get_ai_services

router = APIRouter(prefix="/analysis", tags=["analysis"], dependencies=[Depends(get_current_user)])

ERROR_RESPONSES = {
    400: {"model": ErrorResponse},
    401: {"model": ErrorResponse},
    413: {"model": ErrorResponse},
    415: {"model": ErrorResponse},
    422: {"model": ErrorResponse},
    500: {"model": ErrorResponse},
}


@router.post("/text", response_model=MoodAnalysisResponse, status_code=200, responses=ERROR_RESPONSES)
async def analyze_text(
    payload: TextAnalysisRequest,
    current_user: User = Depends(get_current_user),
) -> MoodAnalysisResponse:
    async with UnitOfWork() as uow:
        await validate_journal_reference(uow, current_user, payload.journal_id)
        services = get_ai_services()
        provider = services.provider
        started_at = datetime.now(UTC)
        analysis = await MoodAnalysisRepository(uow.session).add(
            MoodAnalysis(
                user_id=current_user.id,
                journal_entry_id=payload.journal_id,
                input_type=AnalysisInputType.TEXT,
                status=AnalysisStatus.PROCESSING,
                primary_mood=None,
                confidence=None,
                risk_level=RiskLevel.UNKNOWN,
                emotion_scores={},
                provider_metadata={
                    "provider": provider.name,
                    "model": provider.model,
                    "processing_status": AnalysisStatus.PROCESSING,
                    "processing_started_at": started_at.isoformat(),
                },
            )
        )
        await uow.session.flush()
        try:
            safety = await services.safety.screen(
                {
                    "text": payload.text,
                    "journal_id": str(payload.journal_id) if payload.journal_id else None,
                    "user_id": str(current_user.id),
                }
            )
            emotion = await services.emotion.analyze(
                {"text": payload.text, "analysis_id": str(analysis.id)}
            )
            reflection = await services.reflection.generate(
                {
                    "journal_id": str(payload.journal_id) if payload.journal_id else None,
                    "analysis_id": str(analysis.id),
                    "text": payload.text,
                    "primary_mood": emotion.primary_mood,
                    "risk_level": safety.risk_level,
                }
            )
            completed_at = datetime.now(UTC)
            scores = {item.label: item.score for item in emotion.emotions}
            analysis.status = AnalysisStatus.COMPLETED
            analysis.primary_mood = emotion.primary_mood
            analysis.confidence = emotion.confidence
            analysis.risk_level = safety.risk_level
            analysis.emotion_scores = scores
            analysis.provider_metadata = {
                **analysis.provider_metadata,
                "provider": reflection.provider or provider.name,
                "model": reflection.model or provider.model,
                "latency_ms": reflection.latency_ms,
                "request_id": reflection.request_id,
                "token_usage": reflection.token_usage,
                "cost_usd": reflection.cost_usd,
                "processing_status": AnalysisStatus.COMPLETED,
                "processing_completed_at": completed_at.isoformat(),
                "summary": reflection.summary,
                "themes": reflection.themes,
                "reflection": reflection.reflection,
                "suggestions": reflection.suggestions,
                "follow_up_questions": reflection.follow_up_questions,
                "safety": safety.model_dump(mode="json"),
            }
        except AIProviderError as exc:
            completed_at = datetime.now(UTC)
            analysis.status = AnalysisStatus.FAILED
            analysis.provider_metadata = {
                **analysis.provider_metadata,
                "processing_status": AnalysisStatus.FAILED,
                "processing_completed_at": completed_at.isoformat(),
                "error": exc.code,
                "error_message": exc.message,
                "details": exc.details,
            }
            await uow.commit()
            raise
        await uow.commit()
        return analysis_response(analysis)


@router.post("/audio", response_model=MoodAnalysisResponse, status_code=202, responses=ERROR_RESPONSES)
async def analyze_audio(
    payload: AudioAnalysisRequest,
    current_user: User = Depends(get_current_user),
) -> MoodAnalysisResponse:
    if payload.media_file_id is None and payload.audio_url is None and payload.upload_id is None:
        raise ValidationException("Audio analysis requires media_file_id, audio_url, or upload_id.")
    async with UnitOfWork() as uow:
        await validate_journal_reference(uow, current_user, payload.journal_id)
        analysis = await MoodAnalysisRepository(uow.session).add(
            MoodAnalysis(
                user_id=current_user.id,
                journal_entry_id=payload.journal_id,
                input_type=AnalysisInputType.AUDIO,
                status=AnalysisStatus.QUEUED,
                risk_level=RiskLevel.UNKNOWN,
                emotion_scores={},
                provider_metadata={
                    "media_file_id": str(payload.media_file_id) if payload.media_file_id else None,
                    "audio_url": str(payload.audio_url) if payload.audio_url else None,
                    "upload_id": payload.upload_id,
                    "ai_pending": True,
                },
            )
        )
        await uow.commit()
        return analysis_response(analysis)


async def validate_journal_reference(
    uow: UnitOfWork,
    current_user: User,
    journal_id,
) -> None:
    if journal_id is None:
        return
    entry = await JournalRepository(uow.session).get_for_user(current_user.id, journal_id)
    if entry is None:
        raise NotFoundException("Referenced journal entry was not found.")


def analysis_response(analysis: MoodAnalysis) -> MoodAnalysisResponse:
    scores = analysis.emotion_scores or {}
    emotions = [
        EmotionScore(label=str(label), score=float(score))
        for label, score in scores.items()
        if isinstance(score, (int, float))
    ]
    metadata = analysis.provider_metadata or {}
    return MoodAnalysisResponse(
        id=analysis.id,
        input_type=analysis.input_type,
        status=analysis.status,
        primary_mood=analysis.primary_mood or "unknown",
        confidence=analysis.confidence or 0.0,
        risk_level=analysis.risk_level,
        emotions=emotions,
        ai_metadata={
            "provider": metadata.get("provider"),
            "provider_model": metadata.get("model"),
            "provider_latency_ms": metadata.get("latency_ms"),
            "provider_cost": metadata.get("cost_usd"),
            "provider_request_id": metadata.get("request_id"),
        }
        if metadata.get("provider")
        else None,
        queued_at=analysis.created_at,
        started_at=metadata.get("processing_started_at"),
        completed_at=metadata.get("processing_completed_at"),
        created_at=analysis.created_at,
    )
