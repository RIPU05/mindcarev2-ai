from fastapi import APIRouter

from app.schemas.auth import (
    AuthMeResponse,
    AuthTokenResponse,
    LoginRequest,
    LogoutResponse,
    RegisterRequest,
)
from app.schemas.common import ErrorResponse

router = APIRouter(prefix="/auth", tags=["auth"])

ERROR_RESPONSES = {
    400: {"model": ErrorResponse},
    401: {"model": ErrorResponse},
    409: {"model": ErrorResponse},
    422: {"model": ErrorResponse},
    500: {"model": ErrorResponse},
}


@router.post("/login", response_model=AuthTokenResponse, status_code=200, responses=ERROR_RESPONSES)
async def login(payload: LoginRequest) -> AuthTokenResponse:
    return AuthTokenResponse.mock()


@router.post("/register", response_model=AuthTokenResponse, status_code=201, responses=ERROR_RESPONSES)
async def register(payload: RegisterRequest) -> AuthTokenResponse:
    return AuthTokenResponse.mock()


@router.post("/logout", response_model=LogoutResponse, status_code=200, responses=ERROR_RESPONSES)
async def logout() -> LogoutResponse:
    return LogoutResponse(success=True)


@router.get("/me", response_model=AuthMeResponse, status_code=200, responses=ERROR_RESPONSES)
async def me() -> AuthMeResponse:
    return AuthMeResponse.mock()
