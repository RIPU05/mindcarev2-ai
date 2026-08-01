from abc import ABC, abstractmethod

from app.services.safety.types import SafetyInput, SafetyResult


class SafetyScreeningService(ABC):
    @abstractmethod
    async def screen(self, payload: SafetyInput) -> SafetyResult:
        """Screen input and return a structured safety result."""
