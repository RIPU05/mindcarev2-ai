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
        pool_data = get_pool_health()
        return DatabaseHealth(
            ok=True,
            pool_size=pool_data.get("pool_size"),
            checked_out=pool_data.get("checked_out"),
            overflow=pool_data.get("overflow"),
        )
    except Exception as exc:
        pool_data = get_pool_health()
        return DatabaseHealth(
            ok=False,
            message=str(exc),
            pool_size=pool_data.get("pool_size"),
            checked_out=pool_data.get("checked_out"),
            overflow=pool_data.get("overflow"),
        )


def get_pool_health() -> dict[str, int | None]:
    pool = engine.sync_engine.pool
    return {
        "pool_size": getattr(pool, "size", lambda: None)(),
        "checked_out": getattr(pool, "checkedout", lambda: None)(),
        "overflow": getattr(pool, "overflow", lambda: None)(),
    }
