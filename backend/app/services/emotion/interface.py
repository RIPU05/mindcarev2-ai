from abc import ABC, abstractmethod

from app.services.emotion.types import EmotionInput, EmotionResult


class EmotionAnalysisService(ABC):
    @abstractmethod
    async def analyze(self, payload: EmotionInput) -> EmotionResult:
        """Analyze emotional signals from approved input."""
