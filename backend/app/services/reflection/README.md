# Reflection Service

## Purpose

Generates supportive reflections from journal content and analysis results after safety screening has completed.

## Inputs

- Journal text or transcript.
- Safety result.
- Emotion analysis result.
- Optional user preferences and historical context.

## Outputs

- Summary.
- Themes.
- Reflection text.
- Suggestions.
- Follow-up questions.

## Responsibilities

- Produce structured reflection content.
- Respect safety constraints from upstream stages.
- Keep provider and prompt details outside API routes.

## Failure Handling

Future implementations should degrade gracefully by returning no reflection or a queued retry when providers are unavailable.

## Future Extensibility

Reflection generation can later support model routing, prompt versioning, localization, and clinician-reviewed templates.
