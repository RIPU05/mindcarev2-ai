from datetime import datetime
from uuid import UUID

from pydantic import Field, HttpUrl

from app.schemas.ai import AIProviderMetadata
from app.schemas.common import ApiSchema, mock_id, mock_timestamp
from app.schemas.enums import AnalysisInputType, AnalysisStatus, RiskLevel


class TextAnalysisRequest(ApiSchema):
    text: str = Field(min_length=1, max_length=20000)
    journal_id: UUID | None = None


class AudioAnalysisRequest(ApiSchema):
    media_file_id: UUID | None = None
    audio_url: HttpUrl | None = None
    upload_id: str | None = Field(default=None, max_length=256)
    journal_id: UUID | None = None


class EmotionScore(ApiSchema):
    label: str
    score: float = Field(ge=0, le=1)


class MoodAnalysisResponse(ApiSchema):
    id: UUID
    input_type: AnalysisInputType
    status: AnalysisStatus
    primary_mood: str
    confidence: float = Field(ge=0, le=1)
    risk_level: RiskLevel
    emotions: list[EmotionScore]
    ai_metadata: AIProviderMetadata | None = None
    queued_at: datetime | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime
    summary: str | None = None
    themes: list[str] | None = Field(default_factory=list)
    reflection: str | None = None
    suggestions: list[str] | None = Field(default_factory=list)
    follow_up_questions: list[str] | None = Field(default_factory=list)

    @classmethod
    def mock(cls, input_type: str) -> "MoodAnalysisResponse":
        normalized_input_type = AnalysisInputType(input_type)
        now = mock_timestamp()
        return cls(
            id=mock_id(),
            input_type=normalized_input_type,
            status=(
                AnalysisStatus.COMPLETED
                if normalized_input_type == AnalysisInputType.TEXT
                else AnalysisStatus.QUEUED
            ),
            primary_mood="neutral",
            confidence=0.0,
            risk_level=RiskLevel.UNKNOWN,
            emotions=[EmotionScore(label="neutral", score=0.0)],
            queued_at=now,
            started_at=now if normalized_input_type == AnalysisInputType.TEXT else None,
            completed_at=(now if normalized_input_type == AnalysisInputType.TEXT else None),
            created_at=now,
        )
