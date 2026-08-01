from pydantic import BaseModel

from app.core.config import settings


class SupabaseAuthConfig(BaseModel):
    url: str | None
    anon_key: str | None
    service_role_key: str | None
    jwt_secret: str | None
    jwt_audience: str

    @property
    def jwks_url(self) -> str | None:
        if self.url is None:
            return None
        return f"{self.url.rstrip('/')}/auth/v1/.well-known/jwks.json"


def get_supabase_auth_config() -> SupabaseAuthConfig:
    return SupabaseAuthConfig(
        url=settings.supabase_url,
        anon_key=settings.supabase_anon_key,
        service_role_key=settings.supabase_service_role_key,
        jwt_secret=settings.supabase_jwt_secret,
        jwt_audience=settings.supabase_jwt_audience,
    )
