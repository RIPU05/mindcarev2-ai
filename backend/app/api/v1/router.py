from fastapi import APIRouter

from app.api.v1.analysis import router as analysis_router
from app.api.v1.assistant import router as assistant_router
from app.api.v1.auth import router as auth_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.health import router as health_router
from app.api.v1.journal import router as journal_router
from app.api.v1.moods import router as moods_router
from app.api.v1.profile import router as profile_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(journal_router)
api_router.include_router(analysis_router)
api_router.include_router(moods_router)
api_router.include_router(dashboard_router)
api_router.include_router(assistant_router)
api_router.include_router(profile_router)
api_router.include_router(health_router)
