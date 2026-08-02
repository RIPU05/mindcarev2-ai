from typing import TypedDict

from pydantic import BaseModel, Field


class ReflectionInput(TypedDict, total=False):
    journal_id: str | None
    analysis_id: str
    text: str
    primary_mood: str
    risk_level: str
    rag_context: str | None


class ReflectionResult(BaseModel):
    summary: str
    themes: list[str] = Field(default_factory=list)
    reflection: str
    suggestions: list[str] = Field(default_factory=list)
    follow_up_questions: list[str] = Field(default_factory=list)
    provider: str | None = None
    model: str | None = None
    latency_ms: int | None = None
    request_id: str | None = None
    token_usage: dict | None = None
    cost_usd: str | None = None
