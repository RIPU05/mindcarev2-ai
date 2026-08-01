# Backend Architecture

The backend is a FastAPI service under `backend/app`. It currently contains route scaffolding, core configuration, middleware and logging modules, schemas, and abstract AI service folders.

## Layers

- API layer: `app/api/v1` owns route contracts and HTTP concerns.
- Schema layer: `app/schemas` owns Pydantic request and response shapes plus shared enums.
- Core layer: `app/core` owns configuration, logging, and cross-cutting middleware.
- Service contracts: `app/services/*` owns abstract interfaces and data types only.
- Future infrastructure: persistence, queue, provider, and storage adapters should be added behind interfaces.

## Dependency Direction

Routes should depend on schemas and service interfaces. Concrete adapters for Supabase, queues, storage, and AI providers should depend inward on those interfaces and be wired through dependency injection.

## Error Strategy

Future implementations should use typed application errors mapped at the API boundary. Safety, AI provider, media, and queue failures should remain distinguishable for observability without leaking sensitive content.

## Authentication

Authentication is modularized under `backend/app/auth`. Supabase Auth remains the identity provider; the backend verifies Bearer JWTs, extracts claims into request context, and synchronizes the local `users`, `profiles`, and `user_settings` rows on first authenticated access.

Protected routers depend on `get_current_user()`. Optional identity can use `get_optional_user()` where future public-but-personalized routes need it. The backend does not implement login, registration, OAuth UI, or password handling.
