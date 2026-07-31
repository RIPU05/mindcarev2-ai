from datetime import datetime
from uuid import UUID

from pydantic import Field

from app.schemas.common import ApiSchema, mock_id, mock_timestamp


class MoodHistoryResponse(ApiSchema):
    id: UUID
    primary_mood: str
    confidence: float = Field(ge=0, le=1)
    source: str
    created_at: datetime

    @classmethod
    def mock(cls, id: UUID | None = None) -> "MoodHistoryResponse":
        return cls(
            id=id or mock_id(),
            primary_mood="neutral",
            confidence=0.0,
            source="text",
            created_at=mock_timestamp(),
        )


class MoodHistoryListResponse(ApiSchema):
    items: list[MoodHistoryResponse]
    total: int
