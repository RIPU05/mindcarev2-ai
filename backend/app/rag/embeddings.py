from abc import ABC, abstractmethod

from app.rag.types import EmbeddingRequest, EmbeddingResult


class EmbeddingProvider(ABC):
    name: str
    model: str

    @abstractmethod
    async def embed_text(self, request: EmbeddingRequest) -> EmbeddingResult:
        """Embed a single text input."""

    @abstractmethod
    async def embed_batch(self, requests: list[EmbeddingRequest]) -> list[EmbeddingResult]:
        """Embed multiple text inputs using the same provider."""
