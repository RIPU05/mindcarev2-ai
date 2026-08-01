# ADR 002: Independent AI Pipeline Stages

## Problem

Safety screening, emotion analysis, reflection generation, and dashboard aggregation have different risk profiles, latency needs, and provider dependencies.

## Decision

Model the AI pipeline as independent stages connected by typed interfaces: journal input, safety screening, emotion analysis, reflection generation, and dashboard aggregation.

## Alternatives

- A single all-in-one AI service.
- Provider-specific calls directly inside API routes.
- Dashboard aggregation from raw prompts and model responses.

## Consequences

Stages can be tested, replaced, retried, and observed independently. The design adds more interfaces up front, but reduces long-term coupling and improves safety governance.
