from datetime import date
from uuid import UUID

from sqlalchemy import Date, Enum, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin
from app.schemas.enums import AnalysisInputType, AnalysisStatus, RiskLevel, StreakType


class MoodAnalysis(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "mood_analyses"
    __table_args__ = (
        Index("ix_mood_analyses_user_id_created_at", "user_id", "created_at"),
        Index("ix_mood_analyses_journal_entry_id", "journal_entry_id"),
        Index("ix_mood_analyses_status", "status"),
        Index("ix_mood_analyses_risk_level", "risk_level"),
    )

    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    journal_entry_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("journal_entries.id"),
        nullable=True,
    )
    input_type: Mapped[AnalysisInputType] = mapped_column(
        Enum(AnalysisInputType, name="analysis_input_type"),
        nullable=False,
    )
    status: Mapped[AnalysisStatus] = mapped_column(
        Enum(AnalysisStatus, name="analysis_status"),
        default=AnalysisStatus.QUEUED,
        nullable=False,
    )
    primary_mood: Mapped[str | None] = mapped_column(String(80), nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    risk_level: Mapped[RiskLevel] = mapped_column(
        Enum(RiskLevel, name="risk_level"),
        default=RiskLevel.UNKNOWN,
        nullable=False,
    )
    emotion_scores: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    provider_metadata: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)

    user: Mapped["User"] = relationship(back_populates="analyses")
    journal_entry: Mapped["JournalEntry | None"] = relationship(back_populates="analyses")


class MoodStreak(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "mood_streaks"
    __table_args__ = (
        Index("ix_mood_streaks_user_id_type", "user_id", "streak_type"),
        Index("ix_mood_streaks_user_id_period", "user_id", "period_start", "period_end"),
    )

    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    streak_type: Mapped[StreakType] = mapped_column(
        Enum(StreakType, name="streak_type"),
        nullable=False,
    )
    current_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    longest_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    period_start: Mapped[date | None] = mapped_column(Date, nullable=True)
    period_end: Mapped[date | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    user: Mapped["User"] = relationship(back_populates="streaks")
