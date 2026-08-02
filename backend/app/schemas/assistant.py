from datetime import datetime
from uuid import UUID

from pydantic import Field

from app.schemas.ai import AIProviderMetadata
from app.schemas.common import ApiSchema, mock_id, mock_timestamp
from app.schemas.enums import AssistantRole, ConversationStatus


class AssistantChatRequest(ApiSchema):
    message: str = Field(min_length=1, max_length=8000)
    conversation_id: UUID | None = None
    journal_id: UUID | None = None


class AssistantChatResponse(ApiSchema):
    conversation_id: UUID
    message_id: UUID
    role: AssistantRole
    content: str
    ai_metadata: AIProviderMetadata | None = None
    created_at: datetime

    @classmethod
    def mock(cls) -> "AssistantChatResponse":
        return cls(
            conversation_id=mock_id(),
            message_id=mock_id(),
            role=AssistantRole.ASSISTANT,
            content="This is a mock assistant response for API contract validation.",
            created_at=mock_timestamp(),
        )


class AssistantConversationResponse(ApiSchema):
    id: UUID
    title: str | None
    status: ConversationStatus
    context: dict
    created_at: datetime
    updated_at: datetime


class AssistantConversationListResponse(ApiSchema):
    items: list[AssistantConversationResponse]
    total: int


class AssistantMessageResponse(ApiSchema):
    id: UUID
    conversation_id: UUID
    role: AssistantRole
    content: str
    message_metadata: dict
    created_at: datetime
    updated_at: datetime


class AssistantMessageListResponse(ApiSchema):
    items: list[AssistantMessageResponse]
    total: int
