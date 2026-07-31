from datetime import datetime
from uuid import UUID

from pydantic import Field

from app.schemas.common import ApiSchema, mock_id, mock_timestamp


class AssistantChatRequest(ApiSchema):
    message: str = Field(min_length=1, max_length=8000)
    conversation_id: UUID | None = None
    journal_id: UUID | None = None


class AssistantChatResponse(ApiSchema):
    conversation_id: UUID
    message_id: UUID
    role: str
    content: str
    created_at: datetime

    @classmethod
    def mock(cls) -> "AssistantChatResponse":
        return cls(
            conversation_id=mock_id(),
            message_id=mock_id(),
            role="assistant",
            content="This is a mock assistant response for API contract validation.",
            created_at=mock_timestamp(),
        )
