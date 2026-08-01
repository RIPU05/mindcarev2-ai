from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.database import get_database_session
from app.repositories import (
    AssistantConversationRepository,
    AssistantMessageRepository,
    JournalRepository,
    MoodAnalysisRepository,
    MoodStreakRepository,
    ProfileRepository,
    UserRepository,
    UserSettingsRepository,
)

DatabaseSession = Annotated[AsyncSession, Depends(get_database_session)]


def get_user_repository(session: DatabaseSession) -> UserRepository:
    return UserRepository(session)


def get_profile_repository(session: DatabaseSession) -> ProfileRepository:
    return ProfileRepository(session)


def get_user_settings_repository(session: DatabaseSession) -> UserSettingsRepository:
    return UserSettingsRepository(session)


def get_journal_repository(session: DatabaseSession) -> JournalRepository:
    return JournalRepository(session)


def get_mood_analysis_repository(session: DatabaseSession) -> MoodAnalysisRepository:
    return MoodAnalysisRepository(session)


def get_mood_streak_repository(session: DatabaseSession) -> MoodStreakRepository:
    return MoodStreakRepository(session)


def get_assistant_conversation_repository(
    session: DatabaseSession,
) -> AssistantConversationRepository:
    return AssistantConversationRepository(session)


def get_assistant_message_repository(session: DatabaseSession) -> AssistantMessageRepository:
    return AssistantMessageRepository(session)
