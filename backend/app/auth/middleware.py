from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.auth.client import auth_client
from app.exceptions import AuthenticationException


class JWTContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        authorization = request.headers.get("authorization")
        if authorization and authorization.lower().startswith("bearer "):
            token = authorization.split(" ", 1)[1].strip()
            try:
                request.state.auth_claims = await auth_client.verify_token(token)
            except AuthenticationException as exc:
                request.state.auth_error = exc
        return await call_next(request)
