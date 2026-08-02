from app.ai.providers.base import AIProvider
from app.services.ai_json import parse_json_object, retry_on_json_error
from app.services.emotion.interface import EmotionAnalysisService
from app.services.emotion.types import EmotionInput, EmotionResult, EmotionSignal


class GeminiEmotionAnalysisService(EmotionAnalysisService):
    def __init__(self, provider: AIProvider) -> None:
        self.provider = provider

    async def analyze(self, payload: EmotionInput) -> EmotionResult:
        from app.core.telemetry import tracer

        with tracer.start_as_current_span("emotion_analysis") as span:
            span.set_attribute("emotion.text_length", len(payload.get("text", "")))

            prompt = (
                "Analyze emotions in this journal entry. Return strict JSON with primary_mood string, "
                "confidence number 0-1, and emotions array of {label, score}."
            )

            async def _call_and_validate() -> EmotionResult:
                response = await self.provider.analyze_text(payload.get("text", ""), system_prompt=prompt)
                data = parse_json_object(response.content)

                primary_mood_val = data.get("primary_mood")
                if not isinstance(primary_mood_val, str) or not primary_mood_val:
                    raise ValueError("primary_mood must be a non-empty string")

                confidence_val = data.get("confidence")
                if not isinstance(confidence_val, (int, float)):
                    raise ValueError("confidence must be a number")

                emotions_val = data.get("emotions")
                if not isinstance(emotions_val, list):
                    raise ValueError("emotions must be a list")

                emotions = []
                for item in emotions_val:
                    if not isinstance(item, dict):
                        raise ValueError("each emotion must be a dict")
                    label = item.get("label")
                    score = item.get("score")
                    if not isinstance(label, str) or not isinstance(score, (int, float)):
                        raise ValueError("each emotion dict must have string 'label' and number 'score'")
                    emotions.append(EmotionSignal(label=label, score=float(score)))

                if not emotions:
                    emotions = [EmotionSignal(label=primary_mood_val, score=float(confidence_val))]

                return EmotionResult(
                    primary_mood=primary_mood_val,
                    confidence=max(0.0, min(1.0, float(confidence_val))),
                    emotions=emotions,
                )

            return await retry_on_json_error(_call_and_validate)
