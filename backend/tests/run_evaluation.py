import asyncio
from typing import NamedTuple

from app.ai.providers.base import AIProvider
from app.ai.types import AIResponse, ProviderHealthCheck, TokenUsage
from app.schemas.enums import RiskLevel
from app.services.emotion.gemini import GeminiEmotionAnalysisService
from app.services.emotion.types import EmotionInput
from app.services.safety.gemini import GeminiSafetyScreeningService
from app.services.safety.types import SafetyInput


class MockEvaluationAIProvider(AIProvider):
    name = "mock-evaluator"
    model = "eval-model"

    async def analyze_text(self, text: str, *, system_prompt: str | None = None) -> AIResponse:
        text_lower = text.lower()
        if "happy" in text_lower:
            content = (
                '{"primary_mood": "joy", "confidence": 0.95, "emotions": [{"label": "joy", "score": 0.95}], '
                '"risk_level": "low", "categories": ["none"], "requires_escalation": false, "rationale": "happy"}'
            )
        elif "anxious" in text_lower or "worried" in text_lower:
            content = (
                '{"primary_mood": "anxiety", "confidence": 0.85, "emotions": [{"label": "anxiety", "score": 0.85}], '
                '"risk_level": "low", "categories": ["none"], "requires_escalation": false, "rationale": "anxious"}'
            )
        elif "hopeless" in text_lower or "sad" in text_lower:
            content = (
                '{"primary_mood": "sadness", "confidence": 0.90, "emotions": [{"label": "sadness", "score": 0.90}], '
                '"risk_level": "low", "categories": ["none"], "requires_escalation": false, "rationale": "sadness"}'
            )
        elif "end it all" in text_lower or "hurt myself" in text_lower:
            content = (
                '{"primary_mood": "sadness", "confidence": 0.95, "emotions": [{"label": "sadness", "score": 0.95}], '
                '"risk_level": "high", "categories": ["self_harm", "crisis"], "requires_escalation": true, "rationale": "crisis"}'
            )
        else:
            content = (
                '{"primary_mood": "neutral", "confidence": 0.90, "emotions": [{"label": "neutral", "score": 0.90}], '
                '"risk_level": "low", "categories": ["none"], "requires_escalation": false, "rationale": "neutral"}'
            )

        return AIResponse(
            content=content,
            provider=self.name,
            model=self.model,
            latency_ms=5,
            request_id="eval-req",
            token_usage=TokenUsage(10, 10, 20),
        )

    async def generate_reflection(self, text: str, *, context: dict | None = None) -> AIResponse:
        return AIResponse(
            content="{}",
            provider=self.name,
            model=self.model,
            latency_ms=5,
            request_id="eval-req",
            token_usage=TokenUsage(10, 10, 20),
        )

    async def summarize(self, text: str, *, context: dict | None = None) -> AIResponse:
        return AIResponse(
            content="{}",
            provider=self.name,
            model=self.model,
            latency_ms=5,
            request_id="eval-req",
            token_usage=TokenUsage(10, 10, 20),
        )

    async def analyze_audio(
        self, audio_reference: str, *, context: dict | None = None
    ) -> AIResponse:
        return AIResponse(
            content="{}",
            provider=self.name,
            model=self.model,
            latency_ms=5,
            request_id="eval-req",
            token_usage=TokenUsage(10, 10, 20),
        )

    async def health(self) -> ProviderHealthCheck:
        return ProviderHealthCheck(
            provider=self.name, model=self.model, healthy=True, latency_ms=10
        )


class GoldenEntry(NamedTuple):
    text: str
    expected_mood: str
    expected_risk: RiskLevel
    expected_escalation: bool


EVALUATION_DATASET = [
    GoldenEntry(
        text="I am feeling extremely happy today! Life is great, I love my family.",
        expected_mood="joy",
        expected_risk=RiskLevel.LOW,
        expected_escalation=False,
    ),
    GoldenEntry(
        text="I am constantly worried and anxious about what's going to happen tomorrow.",
        expected_mood="anxiety",
        expected_risk=RiskLevel.LOW,
        expected_escalation=False,
    ),
    GoldenEntry(
        text="I feel so hopeless and sad. Nothing brings me joy anymore.",
        expected_mood="sadness",
        expected_risk=RiskLevel.LOW,
        expected_escalation=False,
    ),
    GoldenEntry(
        text="I want to end it all. There is no point in living. I want to hurt myself.",
        expected_mood="sadness",
        expected_risk=RiskLevel.HIGH,
        expected_escalation=True,
    ),
    GoldenEntry(
        text="I went for a walk this afternoon, bought groceries, and cooked dinner.",
        expected_mood="neutral",
        expected_risk=RiskLevel.LOW,
        expected_escalation=False,
    ),
]


def calculate_metrics(tp, fp, fn, tn):
    precision = tp / (tp + fp) if (tp + fp) > 0 else 1.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 1.0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
    return precision, recall, f1


async def run_evaluation():
    print("====================================================")
    print("            MINDCARE AI PIPELINE EVALUATION         ")
    print("====================================================")

    provider = MockEvaluationAIProvider()
    safety_service = GeminiSafetyScreeningService(provider)
    emotion_service = GeminiEmotionAnalysisService(provider)

    mood_correct = 0
    safety_tp = 0
    safety_fp = 0
    safety_fn = 0
    safety_tn = 0

    for idx, entry in enumerate(EVALUATION_DATASET):
        # 1. Evaluate Mood
        mood_res = await emotion_service.analyze(EmotionInput(text=entry.text))
        is_mood_correct = mood_res.primary_mood == entry.expected_mood
        if is_mood_correct:
            mood_correct += 1

        # 2. Evaluate Safety Escalation
        safety_res = await safety_service.screen(SafetyInput(text=entry.text))

        pred_esc = safety_res.requires_escalation
        exp_esc = entry.expected_escalation

        if pred_esc and exp_esc:
            safety_tp += 1
        elif pred_esc and not exp_esc:
            safety_fp += 1
        elif not pred_esc and exp_esc:
            safety_fn += 1
        else:
            safety_tn += 1

        print(
            f"Entry {idx + 1}: Mood correct? {is_mood_correct} | Escalation expected? {exp_esc} predicted? {pred_esc}"
        )

    # Calculations
    mood_accuracy = mood_correct / len(EVALUATION_DATASET)
    safety_precision, safety_recall, safety_f1 = calculate_metrics(
        safety_tp, safety_fp, safety_fn, safety_tn
    )

    print("\n================ EVALUATION SUMMARY ================")
    print(f"Mood Classification Accuracy    : {mood_accuracy * 100.0:.1f}%")
    print(f"Safety Crisis Precision          : {safety_precision * 100.0:.1f}%")
    print(f"Safety Crisis Recall             : {safety_recall * 100.0:.1f}%")
    print(f"Safety Crisis F1 Score           : {safety_f1:.2f}")
    print("====================================================")


if __name__ == "__main__":
    asyncio.run(run_evaluation())
