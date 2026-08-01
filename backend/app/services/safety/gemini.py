from app.ai.providers.base import AIProvider
from app.schemas.enums import RiskLevel
from app.services.ai_json import parse_json_object, retry_on_json_error
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

        async def _call_and_validate() -> SafetyResult:
            response = await self.provider.analyze_text(payload.get("text", ""), system_prompt=prompt)
            data = parse_json_object(response.content)

            risk_val = data.get("risk_level")
            if not isinstance(risk_val, str) or risk_val not in {"unknown", "low", "moderate", "high"}:
                raise ValueError(f"Invalid or missing risk_level: {risk_val}")

            categories_val = data.get("categories")
            if not isinstance(categories_val, list):
                raise ValueError("categories must be a list")

            requires_escalation_val = data.get("requires_escalation")
            if not isinstance(requires_escalation_val, bool):
                raise ValueError("requires_escalation must be a boolean")

            rationale_val = data.get("rationale")
            if not isinstance(rationale_val, str):
                raise ValueError("rationale must be a string")

            categories = []
            for item in categories_val:
                try:
                    categories.append(SafetyCategory(str(item)))
                except ValueError:
                    continue

            return SafetyResult(
                risk_level=RiskLevel(risk_val),
                categories=categories or [SafetyCategory.NONE],
                requires_escalation=requires_escalation_val,
                rationale=rationale_val,
            )

        return await retry_on_json_error(_call_and_validate)
