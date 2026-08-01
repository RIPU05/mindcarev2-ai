from datetime import datetime
from uuid import UUID

from pydantic import EmailStr, Field

from app.schemas.common import ApiSchema, mock_id, mock_timestamp


class ProfileUpdateRequest(ApiSchema):
    display_name: str | None = Field(default=None, min_length=1, max_length=120)
    timezone: str | None = Field(default=None, max_length=80)


class ProfileResponse(ApiSchema):
    id: UUID
    email: EmailStr
    display_name: str
    timezone: str
    created_at: datetime
    updated_at: datetime

    @classmethod
    def mock(cls) -> "ProfileResponse":
        now = mock_timestamp()
        return cls(
            id=mock_id(),
            email="user@example.com",
            display_name="MindCare User",
            timezone="UTC",
            created_at=now,
            updated_at=now,
        )
