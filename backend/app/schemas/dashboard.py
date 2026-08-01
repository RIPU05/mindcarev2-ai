from app.schemas.common import ApiSchema
from app.schemas.enums import RiskLevel


class DashboardSummaryResponse(ApiSchema):
    journal_count: int
    mood_count: int
    latest_mood: str | None
    risk_level: RiskLevel

    @classmethod
    def mock(cls) -> "DashboardSummaryResponse":
        return cls(journal_count=0, mood_count=0, latest_mood=None, risk_level=RiskLevel.UNKNOWN)
