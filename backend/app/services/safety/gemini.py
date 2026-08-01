from app.ai.providers.base import AIProvider
from app.ai.exceptions import AIProviderError
from app.schemas.enums import RiskLevel
from app.services.ai_json import parse_json_object
from app.services.safety.interface import SafetyScreeningService
from app.services.safety.types import SafetyCategory, SafetyInput, SafetyResult


class GeminiSafetyScreeningService(SafetyScreeningService):
    def __init__(self, provider: AIProvider) -> None:
        self.provider = provider

    async def screen(self, payload: SafetyInput) -> SafetyResult:
        prompt = (
            "Screen this mental-health journal entry for safety. Return strict JSON with "
            "risk_level one of unknown, low, moderate, high; categories as an array using "
            "self_harm, crisis, violence, abuse, none; requires_escalation boolean; rationale string."
        )
        response = await self.provider.analyze_text(payload.get("text", ""), system_prompt=prompt)
        try:
            data = parse_json_object(response.content)
        except ValueError as exc:
            raise AIProviderError("Gemini safety response was not valid JSON.") from exc
        categories = []
        for item in data.get("categories") or ["none"]:
            try:
                categories.append(SafetyCategory(str(item)))
            except ValueError:
                continue
        return SafetyResult(
            risk_level=self._risk_level(str(data.get("risk_level", RiskLevel.UNKNOWN))),
            categories=categories or [SafetyCategory.NONE],
            requires_escalation=bool(data.get("requires_escalation", False)),
            rationale=data.get("rationale"),
        )

    def _risk_level(self, value: str) -> RiskLevel:
        try:
            return RiskLevel(value)
        except ValueError:
            return RiskLevel.UNKNOWN
