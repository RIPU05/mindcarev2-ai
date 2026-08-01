from dataclasses import dataclass

from app.ai import get_ai_provider
from app.ai.providers.base import AIProvider
from app.services.emotion.interface import EmotionAnalysisService
from app.services.emotion.gemini import GeminiEmotionAnalysisService
from app.services.orchestration.gemini import GeminiAIPipelineOrchestrator
from app.services.orchestration.interface import AIPipelineOrchestrator
from app.services.reflection.gemini import GeminiReflectionGenerationService
from app.services.reflection.interface import ReflectionGenerationService
from app.services.safety.gemini import GeminiSafetyScreeningService
from app.services.safety.interface import SafetyScreeningService


@dataclass(frozen=True)
class AIServiceBundle:
    provider: AIProvider
    safety: SafetyScreeningService
    emotion: EmotionAnalysisService
    reflection: ReflectionGenerationService
    orchestration: AIPipelineOrchestrator


def get_ai_services() -> AIServiceBundle:
    provider = get_ai_provider()
    safety = GeminiSafetyScreeningService(provider)
    emotion = GeminiEmotionAnalysisService(provider)
    reflection = GeminiReflectionGenerationService(provider)
    orchestration = GeminiAIPipelineOrchestrator(safety, emotion, reflection)
    return AIServiceBundle(
        provider=provider,
        safety=safety,
        emotion=emotion,
        reflection=reflection,
        orchestration=orchestration,
    )
