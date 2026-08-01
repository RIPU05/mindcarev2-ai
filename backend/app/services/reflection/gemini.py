from app.ai.providers.base import AIProvider
from app.ai.exceptions import AIProviderError
from app.services.ai_json import parse_json_object
from app.services.reflection.interface import ReflectionGenerationService
from app.services.reflection.types import ReflectionInput, ReflectionResult


class GeminiReflectionGenerationService(ReflectionGenerationService):
    def __init__(self, provider: AIProvider) -> None:
        self.provider = provider

    async def generate(self, payload: ReflectionInput) -> ReflectionResult:
        response = await self.provider.generate_reflection(
            payload.get("text", ""),
            context={
                "primary_mood": payload.get("primary_mood"),
                "risk_level": payload.get("risk_level"),
            },
        )
        try:
            data = parse_json_object(response.content)
        except ValueError as exc:
            raise AIProviderError("Gemini reflection response was not valid JSON.") from exc
        return ReflectionResult(
            summary=str(data.get("summary", "")),
            themes=[str(item) for item in data.get("themes", [])],
            reflection=str(data.get("reflection", "")),
            suggestions=[str(item) for item in data.get("suggestions", [])],
            follow_up_questions=[str(item) for item in data.get("follow_up_questions", [])],
            provider=response.provider,
            model=response.model,
            latency_ms=response.latency_ms,
            request_id=response.request_id,
            token_usage={
                "input_tokens": response.token_usage.input_tokens,
                "output_tokens": response.token_usage.output_tokens,
                "total_tokens": response.token_usage.total_tokens,
            },
            cost_usd=str(response.cost_usd) if response.cost_usd is not None else None,
        )
