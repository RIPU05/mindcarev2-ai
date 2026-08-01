from decimal import Decimal

from pydantic import Field

from app.schemas.common import ApiSchema
from app.schemas.enums import AIProvider


class AIProviderMetadata(ApiSchema):
    provider: AIProvider | None = None
    provider_model: str | None = Field(default=None, max_length=160)
    provider_latency_ms: int | None = Field(default=None, ge=0)
    provider_cost: Decimal | None = Field(default=None, ge=0)
    provider_request_id: str | None = Field(default=None, max_length=256)
