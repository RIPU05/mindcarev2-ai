from enum import StrEnum
from typing import TypedDict

from pydantic import BaseModel, Field

from app.schemas.enums import RiskLevel


class SafetyCategory(StrEnum):
    SELF_HARM = "self_harm"
    CRISIS = "crisis"
    VIOLENCE = "violence"
    ABUSE = "abuse"
    NONE = "none"


class SafetyInput(TypedDict, total=False):
    text: str
    journal_id: str | None
    user_id: str


class SafetyResult(BaseModel):
    risk_level: RiskLevel
    categories: list[SafetyCategory] = Field(default_factory=list)
    requires_escalation: bool = False
    rationale: str | None = None
