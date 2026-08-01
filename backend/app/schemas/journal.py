from datetime import datetime
from uuid import UUID

from pydantic import Field

from app.schemas.common import ApiSchema, mock_id, mock_timestamp
from app.schemas.enums import JournalSource


class JournalCreateRequest(ApiSchema):
    title: str | None = Field(default=None, max_length=160)
    content: str = Field(min_length=1, max_length=20000)
    tags: list[str] = Field(default_factory=list)
    source: JournalSource = JournalSource.MANUAL


class JournalUpdateRequest(ApiSchema):
    title: str | None = Field(default=None, max_length=160)
    content: str | None = Field(default=None, min_length=1, max_length=20000)
    tags: list[str] | None = None


class JournalResponse(ApiSchema):
    id: UUID
    title: str | None
    content: str
    tags: list[str]
    source: JournalSource
    version: int
    created_at: datetime
    updated_at: datetime

    @classmethod
    def mock(cls, id: UUID | None = None) -> "JournalResponse":
        now = mock_timestamp()
        return cls(
            id=id or mock_id(),
            title="Sample journal entry",
            content="This is a mock journal entry for API contract validation.",
            tags=["reflection"],
            source=JournalSource.MANUAL,
            version=1,
            created_at=now,
            updated_at=now,
        )


class JournalListResponse(ApiSchema):
    items: list[JournalResponse]
    total: int
