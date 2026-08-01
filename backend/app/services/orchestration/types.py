from enum import StrEnum
from typing import TypedDict

from pydantic import BaseModel


class PipelineStage(StrEnum):
    JOURNAL = "journal"
    SAFETY_SCREENING = "safety_screening"
    EMOTION_ANALYSIS = "emotion_analysis"
    MOOD_ANALYSIS = "mood_analysis"
    REFLECTION_GENERATION = "reflection_generation"
    SUGGESTIONS = "suggestions"
    FOLLOW_UP_QUESTIONS = "follow_up_questions"
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
