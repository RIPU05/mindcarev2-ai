import json
import logging
from datetime import UTC, datetime, timedelta
from uuid import UUID

from app.core.config import settings
from app.db.uow import UnitOfWork
from app.models.analysis import MoodAnalysis
from app.repositories.analysis import MoodAnalysisRepository
from app.schemas.analysis import AudioAnalysisRequest
from app.schemas.enums import AnalysisStatus

logger = logging.getLogger(__name__)

REDIS_AUDIO_QUEUE_KEY = "mindcare:audio_queue"


async def enqueue_audio_job(
    analysis_id: UUID,
    user_id: UUID,
    payload: AudioAnalysisRequest,
) -> bool:
    """Enqueue audio analysis job to Redis worker queue if available."""
    if not settings.redis_url:
        return False

    job_data = {
        "analysis_id": str(analysis_id),
        "user_id": str(user_id),
        "payload": payload.model_dump(mode="json"),
        "enqueued_at": datetime.now(UTC).isoformat(),
    }

    try:
        import redis.asyncio as aioredis

        r = aioredis.from_url(settings.redis_url)
        await r.rpush(REDIS_AUDIO_QUEUE_KEY, json.dumps(job_data))
        await r.aclose()
        logger.info(f"Audio analysis job {analysis_id} enqueued to Redis queue.")
        return True
    except Exception as exc:
        logger.warning(f"Could not enqueue job {analysis_id} to Redis: {exc}. Using fallback.")
        return False


async def recover_stuck_audio_jobs(timeout_minutes: int = 15) -> int:
    """Recover jobs stuck in PROCESSING status due to worker crashes or timeouts."""
    cutoff = datetime.now(UTC) - timedelta(minutes=timeout_minutes)
    recovered_count = 0

    async with UnitOfWork() as uow:
        repo = MoodAnalysisRepository(uow.session)
        # Scan processing jobs
        from sqlalchemy import select
        from app.schemas.enums import AnalysisInputType

        stmt = select(MoodAnalysis).where(
            MoodAnalysis.input_type == AnalysisInputType.AUDIO,
            MoodAnalysis.status == AnalysisStatus.PROCESSING,
            MoodAnalysis.created_at <= cutoff,
        )
        result = await uow.session.execute(stmt)
        stuck_jobs = result.scalars().all()

        for job in stuck_jobs:
            job.status = AnalysisStatus.FAILED
            job.provider_metadata = {
                **(job.provider_metadata or {}),
                "processing_status": AnalysisStatus.FAILED,
                "error_message": "Audio processing timed out or worker process crashed.",
                "recovered_at": datetime.now(UTC).isoformat(),
            }
            recovered_count += 1

        if recovered_count > 0:
            await uow.commit()
            logger.info(f"Recovered {recovered_count} stuck audio analysis jobs.")

    return recovered_count
