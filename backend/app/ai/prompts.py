from typing import Any

TEXT_ANALYSIS_PROMPT = (
    "Analyze the journal text for safety risk, primary mood, confidence, emotions, themes, "
    "suggestions, and follow-up questions. Return strict JSON."
)

REFLECTION_PROMPT = (
    "Create a concise, supportive mental-health reflection. Return strict JSON with summary, "
    "themes, reflection, suggestions, and follow_up_questions."
)

SUMMARY_PROMPT = "Summarize the content in a calm, clinically careful tone. Return strict JSON."

HEALTH_PROMPT = 'Return the JSON object {"status":"ok"}.'


def journal_prompt(system_prompt: str, text: str) -> str:
    return f"{system_prompt}\n\nJournal text:\n{text}"


def reflection_prompt(text: str, context: dict[str, Any] | None = None) -> str:
    return f"{REFLECTION_PROMPT}\n\nContext:\n{context or {}}\n\nJournal text:\n{text}"


def summary_prompt(text: str, context: dict[str, Any] | None = None) -> str:
    return f"{SUMMARY_PROMPT}\n\nContext:\n{context or {}}\n\nText:\n{text}"
