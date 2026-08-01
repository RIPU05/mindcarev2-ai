from uuid import UUID

from sqlalchemy import Enum, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin
from app.schemas.enums import JournalSource


class JournalEntry(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "journal_entries"
    __table_args__ = (
        Index("ix_journal_entries_user_id_created_at", "user_id", "created_at"),
        Index("ix_journal_entries_source", "source"),
    )

    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    tags: Mapped[list[str]] = mapped_column(JSONB, default=list, nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    source: Mapped[JournalSource] = mapped_column(
        Enum(JournalSource, name="journal_source"),
        default=JournalSource.MANUAL,
        nullable=False,
    )

    user: Mapped["User"] = relationship(back_populates="journal_entries")
    analyses: Mapped[list["MoodAnalysis"]] = relationship(back_populates="journal_entry")
