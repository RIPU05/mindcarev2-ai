import json
import logging
import sys
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import event
from sqlalchemy.engine import Engine


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        for key, value in record.__dict__.items():
            if key not in logging.LogRecord("", 0, "", 0, "", (), None).__dict__:
                payload[key] = value

        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        return json.dumps(payload, default=str)


def configure_logging() -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())

    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.addHandler(handler)
    root_logger.setLevel(logging.INFO)

    logging.getLogger("uvicorn.access").handlers.clear()


def configure_database_logging() -> None:
    @event.listens_for(Engine, "before_cursor_execute")
    def before_cursor_execute(conn, cursor, statement, parameters, context, executemany) -> None:
        context._mindcare_query_start = datetime.now(timezone.utc)

    @event.listens_for(Engine, "after_cursor_execute")
    def after_cursor_execute(conn, cursor, statement, parameters, context, executemany) -> None:
        started_at = getattr(context, "_mindcare_query_start", None)
        if started_at is None:
            return
        duration_ms = (datetime.now(timezone.utc) - started_at).total_seconds() * 1000
        logging.getLogger("app.db").info(
            "database_query_completed",
            extra={"duration_ms": round(duration_ms, 2)},
        )


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
