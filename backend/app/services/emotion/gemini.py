from app.ai.providers.base import AIProvider
from app.ai.exceptions import AIProviderError
from app.services.ai_json import parse_json_object
from app.services.emotion.interface import EmotionAnalysisService
from app.services.emotion.types import EmotionInput, EmotionResult, EmotionSignal


class GeminiEmotionAnalysisService(EmotionAnalysisService):
    def __init__(self, provider: AIProvider) -> None:
        self.provider = provider

    async def analyze(self, payload: EmotionInput) -> EmotionResult:
        prompt = (
            "Analyze emotions in this journal entry. Return strict JSON with primary_mood string, "
            "confidence number 0-1, and emotions array of {label, score}."
        )
        response = await self.provider.analyze_text(payload.get("text", ""), system_prompt=prompt)
        try:
            data = parse_json_object(response.content)
        except ValueError as exc:
            raise AIProviderError("Gemini emotion response was not valid JSON.") from exc
        emotions = [
            EmotionSignal(label=str(item.get("label", "unknown")), score=float(item.get("score", 0)))
            for item in data.get("emotions", [])
            if isinstance(item, dict)
        ]
        if not emotions:
            emotions = [EmotionSignal(label=str(data.get("primary_mood", "unknown")), score=float(data.get("confidence", 0)))]
        return EmotionResult(
            primary_mood=str(data.get("primary_mood", "unknown")),
            confidence=max(0.0, min(1.0, float(data.get("confidence", 0)))),
            emotions=emotions,
        )
