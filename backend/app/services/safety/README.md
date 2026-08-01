# Safety Service

## Purpose

Screens user input for crisis, self-harm, violence, abuse, or other high-risk signals before downstream AI stages run.

## Inputs

- Journal text or transcript.
- User and request context.
- Optional prior analysis references.

## Outputs

- Risk level.
- Safety categories.
- Escalation recommendations.
- Provider metadata for traceability.

## Responsibilities

- Define the safety-screening boundary.
- Keep risk classification independent from emotion analysis.
- Return structured results that routes and orchestration can interpret.

## Failure Handling

Safety failures should fail closed. Future implementations should avoid producing reflection content when safety screening is unavailable or inconclusive for high-risk input.

## Future Extensibility

Provider adapters, crisis-resource policies, human-review workflows, and locale-specific safety policies can be added behind the interface.
