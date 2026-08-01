# Authentication

Supabase Auth is the identity provider. The backend verifies Supabase-issued JWTs, extracts claims, and synchronizes a local application user row on first authenticated access.

This package does not implement login, registration, OAuth UI, or password handling.

## Modules

- `config.py`: environment-backed Supabase Auth settings.
- `client.py`: JWT verification client using either Supabase JWT secret or JWKS.
- `middleware.py`: optional request-context JWT parsing.
- `dependencies.py`: protected and optional user dependencies plus user synchronization.
