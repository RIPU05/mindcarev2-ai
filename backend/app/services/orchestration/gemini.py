from app.services.emotion.interface import EmotionAnalysisService
from app.services.orchestration.interface import AIPipelineOrchestrator
from app.services.orchestration.types import PipelineInput, PipelineResult, PipelineStage
from app.services.reflection.interface import ReflectionGenerationService
from app.services.safety.interface import SafetyScreeningService


class GeminiAIPipelineOrchestrator(AIPipelineOrchestrator):
    def __init__(
        self,
        safety: SafetyScreeningService,
        emotion: EmotionAnalysisService,
        reflection: ReflectionGenerationService,
    ) -> None:
        self.safety = safety
        self.emotion = emotion
        self.reflection = reflection

    async def run(self, payload: PipelineInput) -> PipelineResult:
        completed = [PipelineStage.JOURNAL]
        safety = await self.safety.screen(
            {"text": payload.get("text", ""), "journal_id": payload.get("journal_id"), "user_id": payload.get("user_id")}
        )
        completed.append(PipelineStage.SAFETY_SCREENING)
        emotion = await self.emotion.analyze({"text": payload.get("text", ""), "analysis_id": payload.get("analysis_id")})
        completed.append(PipelineStage.EMOTION_ANALYSIS)
        completed.append(PipelineStage.MOOD_ANALYSIS)
        await self.reflection.generate(
            {
                "journal_id": payload.get("journal_id"),
                "analysis_id": payload.get("analysis_id"),
                "text": payload.get("text", ""),
                "primary_mood": emotion.primary_mood,
                "risk_level": safety.risk_level,
            }
        )
        completed.append(PipelineStage.REFLECTION_GENERATION)
        completed.append(PipelineStage.SUGGESTIONS)
        completed.append(PipelineStage.FOLLOW_UP_QUESTIONS)
        completed.append(PipelineStage.DASHBOARD)
        return PipelineResult(
            analysis_id=str(payload.get("analysis_id", "")),
            completed_stages=completed,
            current_stage=PipelineStage.DASHBOARD,
        )
