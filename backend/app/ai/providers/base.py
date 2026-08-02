from abc import ABC, abstractmethod
from typing import Any

from app.ai.types import AIResponse, ProviderHealthCheck


class AIProvider(ABC):
    name: str
    model: str

    @abstractmethod
    async def analyze_text(self, text: str, *, system_prompt: str | None = None) -> AIResponse:
        """Analyze text and return provider-normalized output."""

    @abstractmethod
    async def generate_reflection(
        self, text: str, *, context: dict[str, Any] | None = None
    ) -> AIResponse:
        """Generate a supportive reflection for journal content."""

    @abstractmethod
    async def summarize(self, text: str, *, context: dict[str, Any] | None = None) -> AIResponse:
        """Summarize content for dashboard or assistant contexts."""

    @abstractmethod
    async def analyze_audio(
        self, audio_reference: str, *, context: dict[str, Any] | None = None
    ) -> AIResponse:
        """Analyze audio when a concrete provider implementation supports it."""

    @abstractmethod
    async def health(self) -> ProviderHealthCheck:
        """Check provider reachability."""
