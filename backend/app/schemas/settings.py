from datetime import datetime
from uuid import UUID

from pydantic import Field

from app.schemas.common import ApiSchema


class UserSettingsUpdateRequest(ApiSchema):
    notifications_enabled: bool | None = None
    privacy_preferences: dict = Field(default_factory=dict)
    accessibility_preferences: dict = Field(default_factory=dict)


class UserSettingsResponse(ApiSchema):
    id: UUID
    notifications_enabled: bool
    privacy_preferences: dict
    accessibility_preferences: dict
    created_at: datetime
    updated_at: datetime
