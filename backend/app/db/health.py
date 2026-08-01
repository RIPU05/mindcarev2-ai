from pydantic import BaseModel
from sqlalchemy import text

from app.db.database import engine


class DatabaseHealth(BaseModel):
    ok: bool
    pool_size: int | None = None
    checked_out: int | None = None
    overflow: int | None = None
    message: str | None = None


async def check_database_health() -> DatabaseHealth:
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
        return DatabaseHealth(ok=True, **get_pool_health())
    except Exception as exc:
        return DatabaseHealth(ok=False, message=str(exc), **get_pool_health())


def get_pool_health() -> dict[str, int | None]:
    pool = engine.sync_engine.pool
    return {
        "pool_size": getattr(pool, "size", lambda: None)(),
        "checked_out": getattr(pool, "checkedout", lambda: None)(),
        "overflow": getattr(pool, "overflow", lambda: None)(),
    }
