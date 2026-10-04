import asyncio
import logging
import time
from abc import ABC, abstractmethod
from typing import Any

from pydantic import BaseModel, Field

from app.core.config import settings

logger = logging.getLogger(__name__)


class VoiceEmotionScore(BaseModel):
    label: str
    score: float = Field(ge=0.0, le=1.0)


class AudioEmotionResult(BaseModel):
    status: str = Field(default="completed", description="completed, not_available, or failed")
    primary_emotion: str | None = None
    confidence: float | None = None
    emotions: list[VoiceEmotionScore] = Field(default_factory=list)
    model: str = Field(default="wav2vec2-speech-emotion")
    provider: str = Field(default="wav2vec2_acoustic_model")
    latency_ms: int | None = None
    error_message: str | None = None


class AudioEmotionInput(BaseModel):
    audio_url: str | None = None
    media_file_id: str | None = None
    upload_id: str | None = None
    audio_bytes: bytes | None = None
    mime_type: str = "audio/wav"


class AudioEmotionService(ABC):
    @abstractmethod
    async def analyze_voice_emotion(self, payload: AudioEmotionInput) -> AudioEmotionResult:
        """Analyze acoustic speech signals from audio data."""


class DefaultAudioEmotionService(AudioEmotionService):
    _shared_pipeline: Any = None
    _shared_initialized: bool = False

    def __init__(self, model_name: str | None = None, device: str | None = None) -> None:
        self.model_name = model_name or settings.audio_emotion_model
        self.device = device or settings.audio_emotion_device
        self._pipeline: Any = None
        self._initialized: bool = False

    def _load_model_sync(self) -> Any:
        if self._initialized:
            return self._pipeline
        if DefaultAudioEmotionService._shared_initialized:
            return DefaultAudioEmotionService._shared_pipeline

        DefaultAudioEmotionService._shared_initialized = True
        self._initialized = True
        if not settings.audio_emotion_enabled:
            logger.info("Acoustic voice emotion model disabled by configuration.")
            return None

        try:
            import os
            import shutil

            # Ensure ffmpeg is available on PATH if missing
            if shutil.which("ffmpeg") is None:
                try:
                    import imageio_ffmpeg

                    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
                    ffmpeg_dir = os.path.dirname(ffmpeg_exe)
                    target_exe = os.path.join(ffmpeg_dir, "ffmpeg.exe")
                    if not os.path.exists(target_exe):
                        shutil.copy(ffmpeg_exe, target_exe)
                    os.environ["PATH"] = ffmpeg_dir + os.pathsep + os.environ.get("PATH", "")
                    logger.info(f"Added FFmpeg to PATH from imageio_ffmpeg: {ffmpeg_dir}")
                except Exception as ff_err:
                    logger.warning(f"Could not auto-locate FFmpeg via imageio_ffmpeg: {ff_err}")

            from transformers import pipeline

            logger.info(f"Loading acoustic voice emotion model: {self.model_name} on device: {self.device}")
            DefaultAudioEmotionService._shared_pipeline = pipeline(
                "audio-classification",
                model=self.model_name,
                device=0 if self.device.startswith("cuda") else -1,
            )
            self._pipeline = DefaultAudioEmotionService._shared_pipeline
            return DefaultAudioEmotionService._shared_pipeline
        except Exception as exc:
            logger.warning(
                f"Acoustic voice emotion model ({self.model_name}) could not be loaded: {exc}. "
                "Voice emotion detection will return status='not_available'."
            )
            DefaultAudioEmotionService._shared_pipeline = None
            self._pipeline = None
            return None

    def _run_inference_sync(self, audio_data: Any) -> list[dict[str, Any]]:
        pipe = self._load_model_sync()
        if pipe is None:
            raise RuntimeError("Model pipeline not available")
        results = pipe(audio_data)
        if isinstance(results, list):
            return results
        return [results]

    async def analyze_voice_emotion(self, payload: AudioEmotionInput) -> AudioEmotionResult:
        if not settings.audio_emotion_enabled:
            return AudioEmotionResult(
                status="not_available",
                model=self.model_name,
                error_message="Voice emotion detection is disabled in configuration.",
            )

        start_time = time.perf_counter()

        # Check if pipeline can be initialized
        try:
            pipe = await asyncio.to_thread(self._load_model_sync)
        except Exception as exc:
            return AudioEmotionResult(
                status="not_available",
                model=self.model_name,
                error_message=f"Model loading error: {exc}",
            )

        if pipe is None:
            return AudioEmotionResult(
                status="not_available",
                model=self.model_name,
                error_message="Acoustic voice emotion model is not loaded in this environment.",
            )

        audio_target = payload.audio_bytes or payload.audio_url or payload.media_file_id or payload.upload_id
        if not audio_target:
            return AudioEmotionResult(
                status="failed",
                model=self.model_name,
                error_message="No valid audio data provided for voice emotion analysis.",
            )

        try:
            raw_predictions = await asyncio.to_thread(self._run_inference_sync, audio_target)
            latency_ms = int((time.perf_counter() - start_time) * 1000)

            scores: list[VoiceEmotionScore] = []
            for item in raw_predictions:
                label = str(item.get("label", "unknown")).lower()
                score = float(item.get("score", 0.0))
                scores.append(VoiceEmotionScore(label=label, score=round(score, 4)))

            scores.sort(key=lambda x: x.score, reverse=True)
            primary = scores[0].label if scores else "unknown"
            confidence = scores[0].score if scores else 0.0

            return AudioEmotionResult(
                status="completed",
                primary_emotion=primary,
                confidence=confidence,
                emotions=scores,
                model=self.model_name,
                provider="wav2vec2_acoustic_model",
                latency_ms=latency_ms,
            )
        except Exception as exc:
            logger.warning(f"Voice emotion inference failed: {exc}")
            latency_ms = int((time.perf_counter() - start_time) * 1000)
            return AudioEmotionResult(
                status="failed",
                model=self.model_name,
                latency_ms=latency_ms,
                error_message=f"Voice emotion inference failed: {exc}",
            )
