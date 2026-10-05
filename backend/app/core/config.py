from functools import lru_cache
from typing import Any

from dotenv import load_dotenv
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = Field(default="MindCare AI API", alias="APP_NAME")
    app_env: str = Field(default="development", alias="APP_ENV")
    app_version: str = Field(default="2.0.0", alias="APP_VERSION")
    debug: bool = Field(default=False, alias="DEBUG")
    api_prefix: str = Field(default="/api/v1", alias="API_PREFIX")
    api_host: str = Field(default="0.0.0.0", alias="API_HOST")  # nosec B104
    api_port: int = Field(default=8000, alias="API_PORT")
    backend_cors_origins: list[str] = Field(
        default=["http://localhost:3000"],
        alias="BACKEND_CORS_ORIGINS",
    )
    trusted_hosts: list[str] = Field(default=["localhost", "127.0.0.1"], alias="TRUSTED_HOSTS")
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/mindcare",
        alias="DATABASE_URL",
    )
    database_echo: bool = Field(default=False, alias="DATABASE_ECHO")
    database_pool_size: int = Field(default=5, alias="DATABASE_POOL_SIZE")
    database_max_overflow: int = Field(default=10, alias="DATABASE_MAX_OVERFLOW")
    supabase_url: str | None = Field(default=None, alias="SUPABASE_URL")
    supabase_anon_key: str | None = Field(default=None, alias="SUPABASE_ANON_KEY")
    supabase_service_role_key: str | None = Field(default=None, alias="SUPABASE_SERVICE_ROLE_KEY")
    supabase_jwt_secret: str | None = Field(default=None, alias="SUPABASE_JWT_SECRET")
    supabase_jwt_audience: str = Field(default="authenticated", alias="SUPABASE_JWT_AUDIENCE")
    auth_cookie_secure: bool = Field(default=True, alias="AUTH_COOKIE_SECURE")
    auth_cookie_samesite: str = Field(default="lax", alias="AUTH_COOKIE_SAMESITE")
    default_ai_provider: str = Field(default="gemini", alias="DEFAULT_AI_PROVIDER")
    gemini_api_key: str | None = Field(default=None, alias="GEMINI_API_KEY")
    gemini_model: str = Field(default="gemini-1.5-flash", alias="GEMINI_MODEL")
    openai_api_key: str | None = Field(default=None, alias="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4o-mini", alias="OPENAI_MODEL")
    anthropic_api_key: str | None = Field(default=None, alias="ANTHROPIC_API_KEY")
    anthropic_model: str = Field(default="claude-3-5-haiku-latest", alias="ANTHROPIC_MODEL")
    groq_api_key: str | None = Field(default=None, alias="GROQ_API_KEY")
    groq_model: str = Field(default="llama-3.1-8b-instant", alias="GROQ_MODEL")
    ollama_base_url: str = Field(default="http://localhost:11434", alias="OLLAMA_BASE_URL")
    ollama_model: str = Field(default="llama3.1", alias="OLLAMA_MODEL")
    ai_timeout: float = Field(default=30.0, alias="AI_TIMEOUT")
    ai_max_retries: int = Field(default=2, alias="AI_MAX_RETRIES")

    @field_validator("backend_cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: Any) -> list[str]:
        if isinstance(value, str):
            value = value.strip()
            if value.startswith("[") and value.endswith("]"):
                import json

                try:
                    return json.loads(value)
                except Exception:
                    pass
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @field_validator("debug", mode="before")
    @classmethod
    def parse_debug(cls, value: Any) -> bool:
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"1", "true", "yes", "on", "debug", "development"}:
                return True
            if normalized in {"0", "false", "no", "off", "release", "production"}:
                return False
        return value

    @field_validator("database_url", mode="before")
    @classmethod
    def parse_database_url(cls, value: Any) -> Any:
        if isinstance(value, str):
            url = value.strip()
            if url.startswith("postgres://"):
                return "postgresql+asyncpg://" + url[len("postgres://") :]
            if url.startswith("postgresql://"):
                return "postgresql+asyncpg://" + url[len("postgresql://") :]
        return value

    @field_validator("trusted_hosts", mode="before")
    @classmethod
    def parse_trusted_hosts(cls, value: Any) -> list[str]:
        if isinstance(value, str):
            return [host.strip() for host in value.split(",") if host.strip()]
        return value



@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
