# ADR 001: Monorepo Architecture

## Problem

MindCare AI is moving from a legacy Streamlit application to a SaaS architecture with separate frontend, backend, and future worker concerns. The project needs shared visibility across contracts without coupling runtime deployments.

## Decision

Use a monorepo with top-level `frontend/`, `backend/`, `legacy/`, and `docs/` directories. Keep legacy code archived and isolate modern SaaS code by runtime.

## Alternatives

- Separate repositories for frontend and backend.
- Keep the legacy Streamlit project as the root application.
- Package everything into a single full-stack runtime.

## Consequences

Shared architecture and contracts are easier to review together. Runtime boundaries remain clear, but CI and ownership rules must prevent accidental cross-layer coupling.
