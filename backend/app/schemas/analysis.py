from datetime import datetime
from uuid import UUID

from pydantic import Field, HttpUrl

from app.schemas.common import ApiSchema, mock_id, mock_timestamp


class TextAnalysisRequest(ApiSchema):
    text: str = Field(min_length=1, max_length=20000)
    journal_id: UUID | None = None


class AudioAnalysisRequest(ApiSchema):
    audio_url: HttpUrl | None = None
    upload_id: str | None = Field(default=None, max_length=256)
    journal_id: UUID | None = None


class EmotionScore(ApiSchema):
    label: str
    score: float = Field(ge=0, le=1)


class MoodAnalysisResponse(ApiSchema):
    id: UUID
    input_type: str
    status: str
    primary_mood: str
    confidence: float = Field(ge=0, le=1)
    emotions: list[EmotionScore]
    created_at: datetime

    @classmethod
    def mock(cls, input_type: str) -> "MoodAnalysisResponse":
        return cls(
            id=mock_id(),
            input_type=input_type,
            status="completed" if input_type == "text" else "accepted",
            primary_mood="neutral",
            confidence=0.0,
            emotions=[EmotionScore(label="neutral", score=0.0)],
            created_at=mock_timestamp(),
        )
