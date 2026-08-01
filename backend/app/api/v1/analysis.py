from fastapi import APIRouter, Depends

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
        analysis = await MoodAnalysisRepository(uow.session).add(
            MoodAnalysis(
                user_id=current_user.id,
                journal_entry_id=payload.journal_id,
                input_type=AnalysisInputType.TEXT,
                status=AnalysisStatus.QUEUED,
                primary_mood=None,
                confidence=None,
                risk_level=RiskLevel.UNKNOWN,
                emotion_scores={},
                provider_metadata={"ai_pending": True},
            )
        )
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
    return MoodAnalysisResponse(
        id=analysis.id,
        input_type=analysis.input_type,
        status=analysis.status,
        primary_mood=analysis.primary_mood or "unknown",
        confidence=analysis.confidence or 0.0,
        risk_level=analysis.risk_level,
        emotions=emotions,
        ai_metadata=None,
        queued_at=analysis.created_at,
        started_at=None,
        completed_at=None,
        created_at=analysis.created_at,
    )
