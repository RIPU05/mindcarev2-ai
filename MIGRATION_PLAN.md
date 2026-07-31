# MindCare AI Migration Plan

## Goal

Modernize the existing **AI Mental Health Detection** Streamlit project into **MindCare AI**, a production-ready application with a clearer frontend/backend split and AI API integration.

## Current State

The original application is preserved under `legacy/`.

The v1 system includes:

- Streamlit UI
- Local scikit-learn model inference
- Local `.pkl` model artifacts
- Text preprocessing
- Audio upload and speech-to-text support
- Rule-based and optional API-backed chatbot behavior
- Training and dataset preparation scripts

The v1 application should remain runnable while v2 is built.

## Target State

The planned v2 architecture is:

- `frontend/`: Next.js user interface
- `backend/`: FastAPI application and service layer
- `shared/`: shared contracts, schemas, validation models, and cross-service types
- `docs/`: architecture, product, safety, deployment, and operations documentation
- `legacy/`: preserved v1 reference implementation

## Migration Principles

- Preserve existing behavior until replacement paths are implemented and verified.
- Keep legacy code available for comparison, validation, and rollback.
- Avoid mixing v2 code into the legacy Streamlit application.
- Move functionality behind explicit service boundaries before changing behavior.
- Treat model outputs, mental-health wording, crisis handling, and privacy behavior as high-risk surfaces.

## Phases

### Phase 1: Repository Preparation

Status: complete.

- Move the existing Streamlit application and related v1 code into `legacy/`.
- Create top-level directories for the planned v2 architecture.
- Document the transition path.
- Keep v1 runnable from `legacy/streamlit_app.py`.

### Phase 2: Architecture Foundation

Status: not started.

- Define API contracts for analysis, recommendations, chat, and history.
- Choose shared schema format.
- Establish backend app structure.
- Establish frontend app structure.
- Define environment and configuration strategy.

### Phase 3: Backend Extraction

Status: not started.

- Move inference orchestration into backend services.
- Add typed request/response models.
- Add model/provider abstraction.
- Add safety and crisis-response boundaries.
- Add structured logging and error handling.

### Phase 4: Frontend Implementation

Status: not started.

- Build the Next.js interface.
- Recreate existing v1 flows without changing user-facing behavior.
- Connect to FastAPI endpoints.
- Add durable UX states for loading, errors, and unavailable services.

### Phase 5: AI API Integration

Status: not started.

- Define which tasks use AI APIs.
- Add provider abstraction and configuration.
- Add privacy and consent controls.
- Add safety filters and evaluation cases.
- Keep local ML fallback decisions explicit.

### Phase 6: Production Readiness

Status: not started.

- Add automated tests.
- Add CI checks.
- Add deployment configuration.
- Add observability.
- Add artifact and model governance.
- Add documentation for operations, safety, and privacy.

## Legacy App

Run v1 from the `legacy/` directory:

```bash
cd legacy
streamlit run streamlit_app.py
```

The legacy app should be treated as the behavioral reference during modernization.
