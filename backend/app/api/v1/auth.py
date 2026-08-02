from typing import Any

from fastapi import APIRouter, Depends, Request
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.client import auth_client
from app.auth.dependencies import bearer_scheme, get_current_user, sync_authenticated_user
from app.auth.rate_limiter import auth_rate_limiter
from app.dependencies.database import get_database_session
from app.models.users import User
from app.repositories.users import ProfileRepository
from app.schemas.auth import (
    AuthMeResponse,
    AuthTokenResponse,
    LoginRequest,
    LogoutResponse,
    RefreshSessionRequest,
    RegisterRequest,
    UserSummary,
)
from app.schemas.common import ErrorResponse

router = APIRouter(prefix="/auth", tags=["auth"])

ERROR_RESPONSES: dict[int | str, dict] = {
    400: {"model": ErrorResponse},
    401: {"model": ErrorResponse},
    409: {"model": ErrorResponse},
    422: {"model": ErrorResponse},
    500: {"model": ErrorResponse},
}


@router.post(
    "/login",
    response_model=AuthTokenResponse,
    status_code=200,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(auth_rate_limiter)],
)
async def login(
    payload: LoginRequest, session: AsyncSession = Depends(get_database_session)
) -> AuthTokenResponse:
    supabase_response = await auth_client.sign_in_with_password(payload.email, payload.password)
    return await build_auth_response(supabase_response, session)


@router.post(
    "/register",
    response_model=AuthTokenResponse,
    status_code=201,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(auth_rate_limiter)],
)
async def register(
    payload: RegisterRequest, session: AsyncSession = Depends(get_database_session)
) -> AuthTokenResponse:
    supabase_response = await auth_client.sign_up(
        payload.email, payload.password, payload.display_name
    )
    return await build_auth_response(supabase_response, session)


@router.post(
    "/refresh",
    response_model=AuthTokenResponse,
    status_code=200,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(auth_rate_limiter)],
)
async def refresh(
    payload: RefreshSessionRequest,
    session: AsyncSession = Depends(get_database_session),
) -> AuthTokenResponse:
    if auth_client.is_refresh_token_invalid(payload.refresh_token):
        from app.exceptions import InvalidTokenException

        raise InvalidTokenException("Refresh token has already been used.")
    supabase_response = await auth_client.refresh_session(payload.refresh_token)
    auth_client.invalidate_refresh_token(payload.refresh_token)
    return await build_auth_response(supabase_response, session)


@router.post("/logout", response_model=LogoutResponse, status_code=200, responses=ERROR_RESPONSES)
async def logout(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> LogoutResponse:
    if credentials is not None:
        await auth_client.sign_out(credentials.credentials)
        auth_client.invalidate_access_token(credentials.credentials)

    ref_tok = request.headers.get("x-refresh-token")
    if not ref_tok:
        try:
            body = await request.json()
            ref_tok = body.get("refresh_token")
        except Exception:
            pass
    if ref_tok:
        auth_client.invalidate_refresh_token(ref_tok)

    return LogoutResponse(success=True)


@router.get(
    "/me",
    response_model=AuthMeResponse,
    status_code=200,
    responses=ERROR_RESPONSES,
)
async def me(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_database_session),
) -> AuthMeResponse:
    profile = await ProfileRepository(session).get_by_user_id(current_user.id)
    return AuthMeResponse(
        user=UserSummary(
            id=current_user.id,
            email=current_user.email,
            display_name=(
                profile.display_name if profile and profile.display_name else "MindCare User"
            ),
            created_at=current_user.created_at,
        )
    )


async def build_auth_response(payload: dict[str, Any], session: AsyncSession) -> AuthTokenResponse:
    access_token = payload.get("access_token")
    if not isinstance(access_token, str):
        raise ValueError("Supabase did not return an access token.")
    claims = await auth_client.verify_token(access_token)
    if not claims:
        raise ValueError("Invalid auth claims.")
    user = await sync_authenticated_user(claims, session)
    profile = await ProfileRepository(session).get_by_user_id(user.id)
    user_metadata = claims.get("user_metadata")
    metadata = user_metadata if isinstance(user_metadata, dict) else {}
    display_name = (
        (profile.display_name if profile and profile.display_name else None)
        or metadata.get("display_name")
        or metadata.get("full_name")
        or metadata.get("name")
        or "MindCare User"
    )
    return AuthTokenResponse(
        access_token=access_token,
        refresh_token=payload.get("refresh_token"),
        expires_in=int(payload.get("expires_in", 3600)),
        user=UserSummary(
            id=user.id,
            email=user.email,
            display_name=display_name,
            created_at=user.created_at,
        ),
    )
