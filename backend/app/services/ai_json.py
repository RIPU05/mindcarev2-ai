import json
import logging
from typing import Any, Callable, Coroutine, TypeVar

logger = logging.getLogger(__name__)

T = TypeVar("T")


def parse_json_object(content: str) -> dict[str, Any]:
    cleaned = content.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:].strip()
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start >= 0 and end >= start:
        cleaned = cleaned[start : end + 1]
    parsed = json.loads(cleaned)
    if not isinstance(parsed, dict):
        raise ValueError("AI response must be a JSON object.")
    return parsed


async def retry_on_json_error(
    func: Callable[[], Coroutine[Any, Any, T]],
    max_retries: int = 2,
) -> T:
    last_error = None
    for attempt in range(max_retries + 1):
        try:
            return await func()
        except (ValueError, KeyError) as exc:
            last_error = exc
            if attempt < max_retries:
                logger.warning(
                    f"AI response parsing or validation failed on attempt {attempt + 1}. "
                    f"Retrying... Error: {exc}"
                )
            else:
                logger.error(
                    f"AI response parsing or validation failed after {max_retries + 1} attempts."
                )
    raise last_error
