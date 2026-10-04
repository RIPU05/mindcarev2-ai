from pydantic import BaseModel, Field


class TranscriptionInput(BaseModel):
    audio_url: str | None = None
    media_file_id: str | None = None
    upload_id: str | None = None
    audio_base64: str | None = None
    mime_type: str = Field(default="audio/mp3")


class TranscriptionResult(BaseModel):
    transcript: str
    language: str | None = "en"
    duration_seconds: float | None = None
    provider: str = "gemini"
    confidence: float | None = None
