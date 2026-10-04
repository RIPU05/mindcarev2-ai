import asyncio
import json
import logging
import signal
import sys
from uuid import UUID

from app.api.v1.analysis import process_audio_analysis
from app.core.config import settings
from app.core.logging import configure_logging
from app.schemas.analysis import AudioAnalysisRequest
from app.services.audio.queue import REDIS_AUDIO_QUEUE_KEY, recover_stuck_audio_jobs

logger = logging.getLogger("mindcare.worker")


class AudioQueueWorker:
    def __init__(self) -> None:
        self.running = True

    def stop(self, *args) -> None:
        logger.info("Shutdown signal received. Stopping worker loop...")
        self.running = False

    async def run(self) -> None:
        configure_logging()
        logger.info(f"Starting MindCare AI Audio Queue Worker (Redis: {settings.redis_url})")

        if not settings.redis_url:
            logger.error("REDIS_URL is not configured. Worker cannot start.")
            sys.exit(1)

        import redis.asyncio as aioredis

        client = aioredis.from_url(settings.redis_url)

        last_recovery_time = 0.0

        while self.running:
            try:
                # Run stuck job recovery every 5 minutes
                loop_time = asyncio.get_running_loop().time()
                if loop_time - last_recovery_time > 300:
                    await recover_stuck_audio_jobs(timeout_minutes=15)
                    last_recovery_time = loop_time

                # Pop job from Redis list with 2-second timeout
                res = await client.blpop(REDIS_AUDIO_QUEUE_KEY, timeout=2)
                if not res:
                    continue

                _, raw_data = res
                job = json.loads(raw_data)
                analysis_id = UUID(job["analysis_id"])
                user_id = UUID(job["user_id"])
                payload = AudioAnalysisRequest(**job["payload"])

                logger.info(f"Worker processing audio job: {analysis_id}")
                await process_audio_analysis(analysis_id, user_id, payload)
                logger.info(f"Worker completed audio job: {analysis_id}")

            except asyncio.CancelledError:
                break
            except Exception as exc:
                logger.error(f"Worker encountered error processing job: {exc}", exc_info=True)
                await asyncio.sleep(1)

        await client.aclose()
        logger.info("Audio Queue Worker stopped cleanly.")


def main() -> None:
    worker = AudioQueueWorker()
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, worker.stop)
        except NotImplementedError:
            pass

    try:
        loop.run_until_complete(worker.run())
    finally:
        loop.close()


if __name__ == "__main__":
    main()
