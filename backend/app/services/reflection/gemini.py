from app.ai.providers.base import AIProvider
from app.services.ai_json import parse_json_object, retry_on_json_error
from app.services.reflection.interface import ReflectionGenerationService
from app.services.reflection.types import ReflectionInput, ReflectionResult


class GeminiReflectionGenerationService(ReflectionGenerationService):
    def __init__(self, provider: AIProvider) -> None:
        self.provider = provider

    async def generate(self, payload: ReflectionInput) -> ReflectionResult:
        async def _call_and_validate() -> ReflectionResult:
            response = await self.provider.generate_reflection(
                payload.get("text", ""),
                context={
                    "primary_mood": payload.get("primary_mood"),
                    "risk_level": payload.get("risk_level"),
                },
            )
            data = parse_json_object(response.content)

            summary_val = data.get("summary")
            if not isinstance(summary_val, str):
                raise ValueError("summary must be a string")

            themes_val = data.get("themes")
            if not isinstance(themes_val, list):
                raise ValueError("themes must be a list")

            reflection_val = data.get("reflection")
            if not isinstance(reflection_val, str):
                raise ValueError("reflection must be a string")

            suggestions_val = data.get("suggestions")
            if not isinstance(suggestions_val, list):
                raise ValueError("suggestions must be a list")

            follow_up_questions_val = data.get("follow_up_questions")
            if not isinstance(follow_up_questions_val, list):
                raise ValueError("follow_up_questions must be a list")

            return ReflectionResult(
                summary=summary_val,
                themes=[str(item) for item in themes_val],
                reflection=reflection_val,
                suggestions=[str(item) for item in suggestions_val],
                follow_up_questions=[str(item) for item in follow_up_questions_val],
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

        return await retry_on_json_error(_call_and_validate)
