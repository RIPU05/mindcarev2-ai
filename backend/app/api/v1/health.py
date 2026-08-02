import os
import time

import psutil
from fastapi import APIRouter, Response, status

from app.ai import get_ai_provider
from app.core.config import settings
from app.schemas.common import ErrorResponse
from app.schemas.health import HealthResponse

router = APIRouter(tags=["health"])

START_TIME = time.time()


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=200,
    responses={500: {"model": ErrorResponse}},
)
async def health_check() -> HealthResponse:
    # 1. DB Diagnostics
    try:
        from app.db.database import verify_database_connection

        await verify_database_connection()
        db_status = "healthy"
    except Exception as exc:
        db_status = f"unhealthy: {exc}"

    # 2. AI Diagnostics
    try:
        ai_res = await get_ai_provider().health()
        ai_status = "healthy" if ai_res.healthy else f"unhealthy: {ai_res.error}"
    except Exception as exc:
        ai_status = f"unhealthy: {exc}"

    # 3. RAG/Vector Store Diagnostics
    try:
        from app.rag.factory import get_rag_components

        rag = get_rag_components()
        rag_status = "healthy" if rag.vector_store else "unconfigured"
    except Exception as exc:
        rag_status = f"unhealthy: {exc}"

    # 4. Memory Diagnostics
    try:
        process = psutil.Process(os.getpid())
        mem_bytes = process.memory_info().rss
        mem_status = f"{round(mem_bytes / 1024 / 1024, 2)} MB"
    except Exception as exc:
        mem_status = f"unknown: {exc}"

    # 5. Embedding Provider
    try:
        from app.rag.factory import get_rag_components

        rag = get_rag_components()
        emb_status = "healthy" if rag.embedding_provider else "unconfigured"
    except Exception as exc:
        emb_status = f"unhealthy: {exc}"

    # Overall calculation
    is_healthy = (db_status == "healthy") and ("unhealthy" not in ai_status)
    status_str = "healthy" if is_healthy else "unhealthy"

    uptime_seconds = time.time() - START_TIME

    return HealthResponse(
        status=status_str,
        version=settings.app_version,
        details={
            "database": db_status,
            "ai_provider": ai_status,
            "rag_vector_store": rag_status,
            "embedding_provider": emb_status,
            "memory_usage": mem_status,
            "uptime": f"{round(uptime_seconds, 2)}s",
            "active_provider": settings.default_ai_provider,
            "queue_status": "idle",
        },
    )


@router.get("/health/live", status_code=200)
async def live_check() -> dict:
    return {"status": "alive"}


@router.get("/health/ready", status_code=200)
async def ready_check(response: Response) -> dict:
    try:
        from app.db.database import verify_database_connection

        await verify_database_connection()
        db_ok = True
    except Exception:
        db_ok = False

    try:
        ai_res = await get_ai_provider().health()
        ai_ok = ai_res.healthy
    except Exception:
        ai_ok = False

    if db_ok and ai_ok:
        return {"status": "ready"}
    else:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {"status": "unready", "database": db_ok, "ai_provider": ai_ok}


@router.get("/health/ai", status_code=200, responses={500: {"model": ErrorResponse}})
async def ai_health_check() -> dict:
    result = await get_ai_provider().health()
    return {
        "status": "healthy" if result.healthy else "unhealthy",
        "provider": result.provider,
        "model": result.model,
        "latency_ms": result.latency_ms,
        "error": result.error,
    }
