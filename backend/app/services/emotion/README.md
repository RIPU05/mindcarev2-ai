# Emotion Service

## Purpose

Analyzes approved text or transcript input and returns emotion and mood signals.

## Inputs

- Text prepared by the orchestration stage.
- Optional analysis context.
- Safety result reference.

## Outputs

- Primary mood.
- Emotion scores.
- Confidence values.
- Provider metadata.

## Responsibilities

- Keep emotion detection independent from safety and reflection generation.
- Normalize provider-specific labels into product-level emotion contracts.
- Avoid direct database or HTTP concerns.

## Failure Handling

Future implementations should return typed failures that allow analysis jobs to be retried or marked failed without losing the original input reference.

## Future Extensibility

Multiple providers, ensemble scoring, fine-tuned models, and language-specific analyzers can implement the same interface.
