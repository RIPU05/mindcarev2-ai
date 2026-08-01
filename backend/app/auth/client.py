from functools import cached_property
from typing import Any

import httpx
import jwt
from anyio import to_thread
from jwt import ExpiredSignatureError, InvalidTokenError, PyJWKClient

from app.auth.config import SupabaseAuthConfig, get_supabase_auth_config
from app.exceptions import ExpiredTokenException, InvalidTokenException
from app.exceptions import AuthenticationException


class SupabaseAuthClient:
    def __init__(self, config: SupabaseAuthConfig | None = None) -> None:
        self.config = config or get_supabase_auth_config()

    @cached_property
    def jwk_client(self) -> PyJWKClient | None:
        if self.config.jwks_url is None:
            return None
        return PyJWKClient(self.config.jwks_url)

    async def verify_token(self, token: str) -> dict[str, Any]:
        try:
            unverified_header = jwt.get_unverified_header(token)
            algorithm = unverified_header.get("alg", "HS256")
            if algorithm.startswith("HS"):
                if not self.config.jwt_secret:
                    raise InvalidTokenException("Supabase JWT secret is not configured.")
                key: str | bytes = self.config.jwt_secret
            else:
                if self.jwk_client is None:
                    raise InvalidTokenException("Supabase JWKS URL is not configured.")
                key = await self._get_signing_key(token)

            return jwt.decode(
                token,
                key=key,
                algorithms=[algorithm],
                audience=self.config.jwt_audience,
                options={"require": ["exp", "sub"]},
            )
        except ExpiredSignatureError as exc:
            raise ExpiredTokenException("Authentication token has expired.") from exc
        except InvalidTokenException:
            raise
        except InvalidTokenError as exc:
            raise InvalidTokenException("Authentication token is invalid.") from exc

    async def _get_signing_key(self, token: str) -> Any:
        return await to_thread.run_sync(lambda: self.jwk_client.get_signing_key_from_jwt(token).key)

    async def sign_in_with_password(self, email: str, password: str) -> dict[str, Any]:
        return await self._auth_request(
            "POST",
            "/token?grant_type=password",
            json={"email": email, "password": password},
            use_anon_key=True,
        )

    async def sign_up(self, email: str, password: str, display_name: str) -> dict[str, Any]:
        return await self._auth_request(
            "POST",
            "/signup",
            json={"email": email, "password": password, "data": {"display_name": display_name}},
            use_anon_key=True,
        )

    async def refresh_session(self, refresh_token: str) -> dict[str, Any]:
        return await self._auth_request(
            "POST",
            "/token?grant_type=refresh_token",
            json={"refresh_token": refresh_token},
            use_anon_key=True,
        )

    async def sign_out(self, access_token: str) -> None:
        await self._auth_request(
            "POST",
            "/logout",
            bearer_token=access_token,
            use_anon_key=True,
        )

    async def _auth_request(
        self,
        method: str,
        path: str,
        *,
        json: dict[str, Any] | None = None,
        bearer_token: str | None = None,
        use_anon_key: bool = False,
    ) -> dict[str, Any]:
        if not self.config.url:
            raise AuthenticationException("Supabase URL is not configured.")
        api_key = self.config.anon_key if use_anon_key else self.config.service_role_key
        if not api_key:
            raise AuthenticationException("Supabase API key is not configured.")

        headers = {"apikey": api_key, "Content-Type": "application/json"}
        if bearer_token:
            headers["Authorization"] = f"Bearer {bearer_token}"
        else:
            headers["Authorization"] = f"Bearer {api_key}"

        async with httpx.AsyncClient(timeout=12.0) as client:
            response = await client.request(
                method,
                f"{self.config.url.rstrip('/')}/auth/v1{path}",
                json=json,
                headers=headers,
            )

        if response.status_code >= 400:
            detail = response.text
            try:
                payload = response.json()
                detail = payload.get("msg") or payload.get("message") or payload.get("error_description") or detail
            except ValueError:
                pass
            raise AuthenticationException(str(detail))

        return response.json() if response.content else {}


auth_client = SupabaseAuthClient()
