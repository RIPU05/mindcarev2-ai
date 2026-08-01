from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

from app.db.errors import translate_database_error
from app.models.users import Profile, User, UserSettings
from app.repositories.base import Repository


class UserRepository(Repository[User]):
    model = User

    async def get_by_email(self, email: str) -> User | None:
        try:
            result = await self.session.scalars(
                select(User).where(User.email == email, User.deleted_at.is_(None)).limit(1)
            )
            return result.first()
        except SQLAlchemyError as exc:
            raise translate_database_error(exc) from exc


class ProfileRepository(Repository[Profile]):
    model = Profile

    async def get_by_user_id(self, user_id) -> Profile | None:
        try:
            result = await self.session.scalars(
                select(Profile).where(Profile.user_id == user_id, Profile.deleted_at.is_(None)).limit(1)
            )
            return result.first()
        except SQLAlchemyError as exc:
            raise translate_database_error(exc) from exc


class UserSettingsRepository(Repository[UserSettings]):
    model = UserSettings

    async def get_by_user_id(self, user_id, *, include_deleted: bool = False) -> UserSettings | None:
        try:
            statement = select(UserSettings).where(UserSettings.user_id == user_id)
            if not include_deleted:
                statement = statement.where(UserSettings.deleted_at.is_(None))
            result = await self.session.scalars(
                statement.limit(1)
            )
            return result.first()
        except SQLAlchemyError as exc:
            raise translate_database_error(exc) from exc


UsersRepository = UserRepository
