from pydantic import Field

from app.schemas.common import ApiSchema


class HealthResponse(ApiSchema):
    status: str = Field(examples=["healthy"])
    version: str = Field(examples=["2.0.0"])
    details: dict[str, str] = Field(default_factory=dict)
