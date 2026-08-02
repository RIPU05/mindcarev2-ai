from typing import Annotated, Any

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.client import auth_client
from app.dependencies.database import get_database_session
from app.exceptions import InvalidTokenException, MissingTokenException
from app.models.users import Profile, User, UserSettings
from app.repositories.users import ProfileRepository, UserRepository, UserSettingsRepository

bearer_scheme = HTTPBearer(auto_error=False)
OptionalBearer = Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)]
DatabaseSession = Annotated[AsyncSession, Depends(get_database_session)]


def extract_bearer_token(credentials: HTTPAuthorizationCredentials | None) -> str:
    if credentials is None:
        raise MissingTokenException("Bearer authentication token is required.")
    if credentials.scheme.lower() != "bearer" or not credentials.credentials:
        raise InvalidTokenException("Bearer authentication token is invalid.")
    return credentials.credentials


async def verify_bearer_token(credentials: OptionalBearer) -> dict[str, Any]:
    token = extract_bearer_token(credentials)
    return await auth_client.verify_token(token)


async def get_optional_user(
    request: Request,
    credentials: OptionalBearer,
    session: DatabaseSession,
) -> User | None:
    if credentials is None:
        return None
    claims = await verify_bearer_token(credentials)
    user = await sync_authenticated_user(claims, session)
    request.state.current_user = user
    request.state.auth_claims = claims
    return user


async def get_current_user(
    request: Request,
    credentials: OptionalBearer,
    session: DatabaseSession,
) -> User:
    claims = await verify_bearer_token(credentials)
    user = await sync_authenticated_user(claims, session)
    request.state.current_user = user
    request.state.auth_claims = claims
    return user


async def sync_authenticated_user(claims: dict[str, Any], session: AsyncSession) -> User:
    email = claims.get("email")
    if not isinstance(email, str) or not email:
        raise InvalidTokenException("Authentication token does not include an email claim.")
    user_metadata = claims.get("user_metadata")
    metadata = user_metadata if isinstance(user_metadata, dict) else {}
    display_name = metadata.get("display_name") or metadata.get("full_name") or metadata.get("name")

    users = UserRepository(session)
    profiles = ProfileRepository(session)
    settings = UserSettingsRepository(session)

    user = await users.get_by_email(email)
    if user is None:
        user = await users.add(User(email=email))
        await session.flush()

    profile = await profiles.get_by_user_id(user.id)
    if profile is None:
        await profiles.add(Profile(user_id=user.id, display_name=display_name))
    elif display_name and not profile.display_name:
        profile.display_name = display_name
        await profiles.update(profile)

    if await settings.get_by_user_id(user.id) is None:
        await settings.add(UserSettings(user_id=user.id))

    await session.commit()
    return user
