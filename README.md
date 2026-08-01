# MindCare AI

MindCare AI is the modernization path for the original **AI Mental Health Detection** project.

The repository is now organized for a staged transition:

- **v1**: Streamlit + local ML models, preserved under `legacy/`.
- **v2**: Planned production architecture using Next.js + FastAPI + AI APIs.

No v2 application features have been implemented yet. The current working application remains the legacy Streamlit app.

## Repository Layout

```text
.
├── legacy/      # Existing Streamlit application, local ML code, datasets, and model artifacts
├── frontend/    # Reserved for the future Next.js application
├── backend/     # Reserved for the future FastAPI service
├── shared/      # Reserved for shared schemas, contracts, and types
├── docs/        # Reserved for product, architecture, and operational documentation
└── MIGRATION_PLAN.md
```

## Running v1

The existing application has been moved into `legacy/`.

```bash
cd legacy
streamlit run streamlit_app.py
```

The v1 app continues to use the existing Streamlit UI, local scikit-learn model artifacts, audio transcription helper, training scripts, and legacy configuration.

## Migration Status

This repository is in the transition preparation phase. The legacy app has been isolated so the new production architecture can be developed without changing existing behavior.

See [MIGRATION_PLAN.md](MIGRATION_PLAN.md) for the current transition plan.
