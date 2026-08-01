# API Architecture

The API is versioned under `/api/v1`. Existing route modules define the public contract for auth, profile, moods, journal, analysis, dashboard, assistant, and health.

## Contract Guidelines

- Keep routes thin and delegate domain behavior to service interfaces.
- Return stable response envelopes where useful for pagination, errors, and trace IDs.
- Keep AI processing asynchronous for audio, long journal entries, and provider-dependent work.
- Keep route models aligned with frontend `src/types/api.ts` and `src/lib/api/types.ts`.

## Error Model

Future API errors should include a stable code, human-safe message, request ID, and optional field details. Sensitive journal text, prompts, model outputs, and provider responses should not be logged in raw form.

## Authentication

Protected API routes use HTTP Bearer authentication with Supabase-issued JWTs.

Public:

- `GET /health`

Protected:

- `/journal`
- `/analysis`
- `/dashboard`
- `/assistant`
- `/profile`
- `/moods`
- `GET /auth/me`

Example:

```http
Authorization: Bearer <supabase-access-token>
```

Invalid, expired, or missing tokens return typed authentication errors with `WWW-Authenticate: Bearer`.
