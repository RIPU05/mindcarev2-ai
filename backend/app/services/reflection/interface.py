from abc import ABC, abstractmethod

from app.services.reflection.types import ReflectionInput, ReflectionResult


class ReflectionGenerationService(ABC):
    @abstractmethod
    async def generate(self, payload: ReflectionInput) -> ReflectionResult:
        """Generate structured reflection content."""
