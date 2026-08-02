from datetime import datetime
from uuid import UUID

from pydantic import EmailStr, Field

from app.schemas.common import ApiSchema, mock_id, mock_timestamp


class LoginRequest(ApiSchema):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class RegisterRequest(ApiSchema):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str = Field(min_length=1, max_length=120)


class UserSummary(ApiSchema):
    id: UUID
    email: EmailStr
    display_name: str
    created_at: datetime

    @classmethod
    def mock(cls) -> "UserSummary":
        return cls(
            id=mock_id(),
            email="user@example.com",
            display_name="MindCare User",
            created_at=mock_timestamp(),
        )


class AuthTokenResponse(ApiSchema):
    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"
    expires_in: int
    user: UserSummary

    @classmethod
    def mock(cls) -> "AuthTokenResponse":
        return cls(
            access_token="mock_access_token",
            refresh_token="mock_refresh_token",
            expires_in=3600,
            user=UserSummary.mock(),
        )


class RefreshSessionRequest(ApiSchema):
    refresh_token: str = Field(min_length=1)


class LogoutResponse(ApiSchema):
    success: bool


class AuthMeResponse(ApiSchema):
    user: UserSummary

    @classmethod
    def mock(cls) -> "AuthMeResponse":
        return cls(user=UserSummary.mock())
