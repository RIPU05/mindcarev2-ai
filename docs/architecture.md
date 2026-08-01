# MindCare AI v2 Architecture

MindCare AI v2 is organized as a modern SaaS monorepo with a Next.js frontend, FastAPI backend, and Supabase PostgreSQL data layer. The current repository contains foundation code only; feature logic, authentication, AI inference, and persistence integrations remain future work.

## System Boundaries

- `frontend/`: Next.js 15 application shell, providers, route groups, API client architecture, and design-system folders.
- `backend/`: FastAPI service, versioned REST routes, Pydantic schemas, core configuration, and AI service interface boundaries.
- `legacy/`: preserved Streamlit and local ML project. This directory is archival and must not be modified by v2 architecture work.
- `docs/`: architecture documentation, ADRs, and Mermaid diagrams.

## Architectural Principles

- Dependency inversion: API routes depend on schemas and abstract service contracts, not concrete AI or database providers.
- Feature-first organization: user-facing domains such as journal, moods, analysis, dashboard, assistant, and profile remain explicit.
- Independent pipeline stages: safety, emotion analysis, reflection generation, and dashboard aggregation are separately replaceable.
- Strong contracts: backend schemas and frontend API types define stable boundaries before implementation.
- Privacy by design: mental health data should be minimized, auditable, encrypted in transit, and scoped by user ownership.

## Runtime Flow

1. The frontend collects journal, mood, or media input through future feature screens.
2. The API accepts typed requests and returns typed responses or queued job references.
3. AI orchestration coordinates independent service stages through abstract interfaces.
4. Analysis, reflection, dashboard, and audit records are persisted by future repository adapters.
5. Dashboard reads favor cached aggregates where freshness guarantees allow it.

## Non-Goals In This Phase

This phase does not implement authentication, business logic, AI inference, Supabase access, migrations, SQL, or pages. It establishes the architecture required for those future phases.
