from enum import StrEnum
from typing import TypedDict

from pydantic import BaseModel


class PipelineStage(StrEnum):
    JOURNAL = "journal"
    SAFETY_SCREENING = "safety_screening"
    EMOTION_ANALYSIS = "emotion_analysis"
    REFLECTION_GENERATION = "reflection_generation"
    DASHBOARD = "dashboard"


class PipelineInput(TypedDict, total=False):
    journal_id: str
    analysis_id: str
    user_id: str
    text: str


class PipelineResult(BaseModel):
    analysis_id: str
    completed_stages: list[PipelineStage]
    current_stage: PipelineStage | None = None
