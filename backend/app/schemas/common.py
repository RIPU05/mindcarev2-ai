from datetime import datetime, timezone
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field


class ApiSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class ErrorResponse(ApiSchema):
    detail: str = Field(examples=["Request could not be processed."])
    request_id: str | None = Field(default=None, examples=["req_123"])


def mock_id() -> UUID:
    return uuid4()


def mock_timestamp() -> datetime:
    return datetime.now(timezone.utc)
