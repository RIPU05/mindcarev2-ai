from dataclasses import dataclass
from typing import TypedDict


class EmotionInput(TypedDict, total=False):
    text: str
    analysis_id: str
    safety_result_id: str


@dataclass(frozen=True)
class EmotionSignal:
    label: str
    score: float


@dataclass(frozen=True)
class EmotionResult:
    primary_mood: str
    confidence: float
    emotions: list[EmotionSignal]
