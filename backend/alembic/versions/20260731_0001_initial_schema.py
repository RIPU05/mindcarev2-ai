"""initial persistence schema

Revision ID: 20260731_0001
Revises:
Create Date: 2026-07-31 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "20260731_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    user_status = postgresql.ENUM(
        "ACTIVE",
        "DISABLED",
        "DELETED",
        name="user_status",
        create_type=False,
    )
    journal_source = postgresql.ENUM(
        "MANUAL",
        "IMPORTED",
        "VOICE",
        name="journal_source",
        create_type=False,
    )
    analysis_input_type = postgresql.ENUM(
        "TEXT",
        "AUDIO",
        "JOURNAL",
        name="analysis_input_type",
        create_type=False,
    )
    analysis_status = postgresql.ENUM(
        "QUEUED",
        "PROCESSING",
        "COMPLETED",
        "FAILED",
        name="analysis_status",
        create_type=False,
    )
    risk_level = postgresql.ENUM(
        "UNKNOWN",
        "LOW",
        "MODERATE",
        "HIGH",
        name="risk_level",
        create_type=False,
    )
    conversation_status = postgresql.ENUM(
        "ACTIVE",
        "ARCHIVED",
        "DELETED",
        name="conversation_status",
        create_type=False,
    )
    assistant_role = postgresql.ENUM(
        "USER",
        "ASSISTANT",
        "SYSTEM",
        name="assistant_role",
        create_type=False,
    )
    streak_type = postgresql.ENUM(
        "JOURNAL",
        "MOOD_CHECKIN",
        name="streak_type",
        create_type=False,
    )

    bind = op.get_bind()
    dialect_name = bind.dialect.name

    def get_json_type():
        if dialect_name == "postgresql":
            return postgresql.JSONB(astext_type=sa.Text())
        return sa.JSON()

    user_status.create(bind, checkfirst=True)
    journal_source.create(bind, checkfirst=True)
    analysis_input_type.create(bind, checkfirst=True)
    analysis_status.create(bind, checkfirst=True)
    risk_level.create(bind, checkfirst=True)
    conversation_status.create(bind, checkfirst=True)
    assistant_role.create(bind, checkfirst=True)
    streak_type.create(bind, checkfirst=True)

    op.create_table(
        "users",
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("status", user_status, nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_status", "users", ["status"])

    op.create_table(
        "profiles",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("display_name", sa.String(length=120), nullable=True),
        sa.Column("timezone", sa.String(length=64), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index("ix_profiles_user_id", "profiles", ["user_id"])

    op.create_table(
        "user_settings",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("notifications_enabled", sa.Boolean(), nullable=False),
        sa.Column(
            "privacy_preferences",
            get_json_type(),
            nullable=False,
        ),
        sa.Column(
            "accessibility_preferences",
            get_json_type(),
            nullable=False,
        ),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index("ix_user_settings_user_id", "user_settings", ["user_id"])

    op.create_table(
        "journal_entries",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("tags", get_json_type(), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("source", journal_source, nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_journal_entries_user_id_created_at",
        "journal_entries",
        ["user_id", "created_at"],
    )
    op.create_index("ix_journal_entries_source", "journal_entries", ["source"])

    op.create_table(
        "assistant_conversations",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=True),
        sa.Column("status", conversation_status, nullable=False),
        sa.Column("context", get_json_type(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_assistant_conversations_user_id_created_at",
        "assistant_conversations",
        ["user_id", "created_at"],
    )
    op.create_index(
        "ix_assistant_conversations_status",
        "assistant_conversations",
        ["status"],
    )

    op.create_table(
        "mood_analyses",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("journal_entry_id", sa.Uuid(), nullable=True),
        sa.Column("input_type", analysis_input_type, nullable=False),
        sa.Column("status", analysis_status, nullable=False),
        sa.Column("primary_mood", sa.String(length=80), nullable=True),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("risk_level", risk_level, nullable=False),
        sa.Column("emotion_scores", get_json_type(), nullable=False),
        sa.Column("provider_metadata", get_json_type(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["journal_entry_id"], ["journal_entries.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_mood_analyses_user_id_created_at",
        "mood_analyses",
        ["user_id", "created_at"],
    )
    op.create_index("ix_mood_analyses_journal_entry_id", "mood_analyses", ["journal_entry_id"])
    op.create_index("ix_mood_analyses_status", "mood_analyses", ["status"])
    op.create_index("ix_mood_analyses_risk_level", "mood_analyses", ["risk_level"])

    op.create_table(
        "assistant_messages",
        sa.Column("conversation_id", sa.Uuid(), nullable=False),
        sa.Column("role", assistant_role, nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("metadata", get_json_type(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["conversation_id"], ["assistant_conversations.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_assistant_messages_conversation_id_created_at",
        "assistant_messages",
        ["conversation_id", "created_at"],
    )
    op.create_index("ix_assistant_messages_role", "assistant_messages", ["role"])

    op.create_table(
        "mood_streaks",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("streak_type", streak_type, nullable=False),
        sa.Column("current_count", sa.Integer(), nullable=False),
        sa.Column("longest_count", sa.Integer(), nullable=False),
        sa.Column("period_start", sa.Date(), nullable=True),
        sa.Column("period_end", sa.Date(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_mood_streaks_user_id_type", "mood_streaks", ["user_id", "streak_type"])
    op.create_index(
        "ix_mood_streaks_user_id_period",
        "mood_streaks",
        ["user_id", "period_start", "period_end"],
    )


def downgrade() -> None:
    op.drop_index("ix_mood_streaks_user_id_period", table_name="mood_streaks")
    op.drop_index("ix_mood_streaks_user_id_type", table_name="mood_streaks")
    op.drop_table("mood_streaks")

    op.drop_index("ix_assistant_messages_role", table_name="assistant_messages")
    op.drop_index(
        "ix_assistant_messages_conversation_id_created_at",
        table_name="assistant_messages",
    )
    op.drop_table("assistant_messages")

    op.drop_index("ix_mood_analyses_risk_level", table_name="mood_analyses")
    op.drop_index("ix_mood_analyses_status", table_name="mood_analyses")
    op.drop_index("ix_mood_analyses_journal_entry_id", table_name="mood_analyses")
    op.drop_index("ix_mood_analyses_user_id_created_at", table_name="mood_analyses")
    op.drop_table("mood_analyses")

    op.drop_index("ix_assistant_conversations_status", table_name="assistant_conversations")
    op.drop_index(
        "ix_assistant_conversations_user_id_created_at",
        table_name="assistant_conversations",
    )
    op.drop_table("assistant_conversations")

    op.drop_index("ix_journal_entries_source", table_name="journal_entries")
    op.drop_index("ix_journal_entries_user_id_created_at", table_name="journal_entries")
    op.drop_table("journal_entries")

    op.drop_index("ix_user_settings_user_id", table_name="user_settings")
    op.drop_table("user_settings")

    op.drop_index("ix_profiles_user_id", table_name="profiles")
    op.drop_table("profiles")

    op.drop_index("ix_users_status", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

    bind = op.get_bind()
    postgresql.ENUM(name="streak_type").drop(bind, checkfirst=True)
    postgresql.ENUM(name="assistant_role").drop(bind, checkfirst=True)
    postgresql.ENUM(name="conversation_status").drop(bind, checkfirst=True)
    postgresql.ENUM(name="risk_level").drop(bind, checkfirst=True)
    postgresql.ENUM(name="analysis_status").drop(bind, checkfirst=True)
    postgresql.ENUM(name="analysis_input_type").drop(bind, checkfirst=True)
    postgresql.ENUM(name="journal_source").drop(bind, checkfirst=True)
    postgresql.ENUM(name="user_status").drop(bind, checkfirst=True)
