import base64
import ipaddress
import re
from urllib.parse import urlparse

from app.ai.exceptions import AIProviderError
from app.ai.providers.base import AIProvider
from app.exceptions import ValidationException
from app.services.ai_json import parse_json_object, retry_on_json_error
from app.services.audio.interface import AudioTranscriptionService
from app.services.audio.types import TranscriptionInput, TranscriptionResult

PRIVATE_HOST_PATTERNS = [
    re.compile(r"^localhost$", re.I),
    re.compile(r"^127\.\d+\.\d+\.\d+$"),
    re.compile(r"^10\.\d+\.\d+\.\d+$"),
    re.compile(r"^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$"),
    re.compile(r"^192\.168\.\d+\.\d+$"),
    re.compile(r"^169\.254\.\d+\.\d+$"),
    re.compile(r"^0\.0\.0\.0$"),
    re.compile(r"^::1$"),
]


def validate_audio_url_safety(url_str: str) -> None:
    parsed = urlparse(url_str)
    if parsed.scheme.lower() not in {"http", "https"}:
        raise ValidationException("Audio URL must use http or https scheme.")
    hostname = parsed.hostname or ""
    if not hostname:
        raise ValidationException("Invalid audio URL host.")
    
    raw_host = hostname.strip("[]")
    for pattern in PRIVATE_HOST_PATTERNS:
        if pattern.match(raw_host):
            raise ValidationException("Internal/loopback audio URLs are not permitted.")
    try:
        ip_obj = ipaddress.ip_address(raw_host)
        if (
            ip_obj.is_private
            or ip_obj.is_loopback
            or ip_obj.is_link_local
            or ip_obj.is_reserved
            or ip_obj.is_multicast
            or ip_obj.is_unspecified
        ):
            raise ValidationException("Internal/loopback audio URLs are not permitted.")
        return
    except ValueError:
        pass

    try:
        if raw_host.isdigit() or raw_host.startswith(("0x", "0X")):
            int_val = int(raw_host, 0)
            if 0 <= int_val <= 0xFFFFFFFF:
                ip_obj = ipaddress.ip_address(int_val)
                if (
                    ip_obj.is_private
                    or ip_obj.is_loopback
                    or ip_obj.is_link_local
                    or ip_obj.is_reserved
                    or ip_obj.is_multicast
                    or ip_obj.is_unspecified
                ):
                    raise ValidationException("Internal/loopback audio URLs are not permitted.")
    except (ValueError, OverflowError):
        pass


class DefaultAudioTranscriptionService(AudioTranscriptionService):
    def __init__(self, provider: AIProvider) -> None:
        self.provider = provider

    async def transcribe(self, payload: TranscriptionInput) -> TranscriptionResult:
        if payload.audio_url:
            validate_audio_url_safety(payload.audio_url)

        if payload.audio_base64:
            try:
                base64.b64decode(payload.audio_base64)
            except Exception as exc:
                raise ValidationException("Invalid base64 audio payload.") from exc

        prompt = (
            "You are a professional speech-to-text audio transcription service for mental health support. "
            "Given the provided audio data or reference, transcribe the spoken words accurately. "
            "Return strict JSON with keys: transcript (string), language (string, e.g. 'en'), duration_seconds (float)."
        )

        audio_ref = payload.audio_base64 or payload.audio_url or payload.media_file_id or payload.upload_id
        if not audio_ref:
            raise ValidationException("No valid audio source provided for transcription.")

        async def _call_and_validate() -> TranscriptionResult:
            try:
                response = await self.provider.analyze_text(
                    f"Audio source reference: {audio_ref}", system_prompt=prompt
                )
                data = parse_json_object(response.content)
                transcript = data.get("transcript")
                if not isinstance(transcript, str) or not transcript.strip():
                    # Fallback to raw response content if JSON parsing didn't find transcript key
                    transcript = response.content.strip()

                language = data.get("language") if isinstance(data.get("language"), str) else "en"
                duration = data.get("duration_seconds")
                duration_val = float(duration) if isinstance(duration, (int, float)) else None

                return TranscriptionResult(
                    transcript=transcript,
                    language=language,
                    duration_seconds=duration_val,
                    provider=self.provider.name,
                )
            except Exception as exc:
                raise AIProviderError(f"Audio transcription failed: {exc}") from exc

        return await retry_on_json_error(_call_and_validate)
