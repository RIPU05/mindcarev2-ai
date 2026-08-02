from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.v1.router import api_router
from app.auth.middleware import JWTContextMiddleware
from app.core.config import settings
from app.core.logging import configure_database_logging, configure_logging, get_logger
from app.core.middleware import (
    GZipMiddleware,
    RateLimitPlaceholderMiddleware,
    RequestContextMiddleware,
    SecurityHeadersMiddleware,
    TrustedHostMiddleware,
)
from app.db.database import dispose_database_engine, verify_database_connection
from app.exceptions import MindCareException

logger = get_logger(__name__)

openapi_tags = [
    {"name": "auth", "description": "Supabase Auth JWT contract and current-user endpoints."},
    {"name": "journal", "description": "Journal entry request and response contracts."},
    {"name": "analysis", "description": "Mood analysis request and status contracts."},
    {"name": "moods", "description": "Mood check-in and history contracts."},
    {"name": "dashboard", "description": "Dashboard aggregate contracts."},
    {"name": "assistant", "description": "Assistant conversation contracts."},
    {"name": "profile", "description": "User profile contracts."},
    {"name": "health", "description": "Service health and readiness checks."},
]


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    configure_logging()
    configure_database_logging()
    logger.info(
        "application_startup",
        extra={"app_name": settings.app_name, "version": settings.app_version},
    )
    await verify_database_connection()
    try:
        yield
    finally:
        await dispose_database_engine()
        logger.info("application_shutdown", extra={"app_name": settings.app_name})


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description=(
            "MindCare AI v2 backend API. This sprint wires backend infrastructure only: "
            "database, repositories, authentication, middleware, exceptions, and contracts."
        ),
        summary="MindCare AI backend infrastructure API",
        openapi_tags=openapi_tags,
        lifespan=lifespan,
        debug=settings.debug,
    )

    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.trusted_hosts)
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RateLimitPlaceholderMiddleware)
    app.add_middleware(JWTContextMiddleware)
    app.add_middleware(RequestContextMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.backend_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router, prefix=settings.api_prefix)
    app.include_router(api_router)

    from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
    from fastapi import Response

    @app.get("/metrics", tags=["health"])
    def prometheus_metrics():
        return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

    register_exception_handlers(app)

    from app.core.telemetry import instrument_fastapi_app
    instrument_fastapi_app(app)

    return app


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(MindCareException)
    async def mindcare_exception_handler(request: Request, exc: MindCareException) -> JSONResponse:
        logger.warning(
            "application_exception",
            extra={
                "request_id": getattr(request.state, "request_id", None),
                "code": exc.code,
                "path": request.url.path,
            },
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
                "request_id": getattr(request.state, "request_id", None),
            },
            headers={"WWW-Authenticate": "Bearer"} if exc.status_code == 401 else None,
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        request: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        logger.warning(
            "http_exception",
            extra={
                "request_id": getattr(request.state, "request_id", None),
                "status_code": exc.status_code,
                "path": request.url.path,
            },
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "detail": exc.detail,
                "request_id": getattr(request.state, "request_id", None),
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        logger.warning(
            "validation_exception",
            extra={
                "request_id": getattr(request.state, "request_id", None),
                "path": request.url.path,
            },
        )
        return JSONResponse(
            status_code=422,
            content={
                "detail": exc.errors(),
                "request_id": getattr(request.state, "request_id", None),
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception(
            "unhandled_exception",
            extra={
                "request_id": getattr(request.state, "request_id", None),
                "path": request.url.path,
            },
        )
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Internal server error",
                "request_id": getattr(request.state, "request_id", None),
            },
        )


app = create_app()
