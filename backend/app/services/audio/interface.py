from abc import ABC, abstractmethod

from app.services.audio.types import TranscriptionInput, TranscriptionResult


class AudioTranscriptionService(ABC):
    @abstractmethod
    async def transcribe(self, payload: TranscriptionInput) -> TranscriptionResult:
        """Transcribe audio payload into text transcript."""
