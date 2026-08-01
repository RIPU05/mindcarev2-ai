# Authentication Architecture

MindCare AI uses Supabase Auth as the identity provider. The backend does not implement password login, OAuth UI, session screens, or custom token minting.

## Supabase Auth Flow

1. A client authenticates with Supabase Auth outside the backend.
2. Supabase returns an access token.
3. The client sends the token to the backend as `Authorization: Bearer <token>`.
4. The backend verifies the JWT using configured Supabase JWT settings.
5. Verified claims are attached to request context.
6. The local application user is synchronized before protected route handlers run.

## JWT Lifecycle

`backend/app/auth/client.py` verifies token signatures, expiration, audience, and subject claims. HS tokens use `SUPABASE_JWT_SECRET`. Asymmetric tokens use the Supabase JWKS endpoint derived from `SUPABASE_URL`.

Authentication errors are explicit:

- Missing token
- Invalid token
- Expired token
- Unauthorized
- Forbidden

## User Synchronization

`get_current_user()` calls the synchronization flow after JWT verification.

The flow:

1. Read the email claim.
2. Look up `users.email`.
3. Create `users` only when no active row exists.
4. Ensure a matching `profiles` row exists.
5. Ensure a matching `user_settings` row exists.

This uses existing repositories and avoids duplicate users through the unique email constraint.

## Protected Routes

Protected routers:

- journal
- analysis
- dashboard
- assistant
- profile
- moods

Public route:

- health

`GET /auth/me` is protected. Login and registration endpoints remain contract placeholders and should later delegate to Supabase client flows rather than implementing password handling inside this API.

## Repository Interaction

Authentication depends on repository infrastructure only for user synchronization. It does not add business services, domain workflows, AI behavior, or journal logic.

## Security Notes

Security headers, trusted hosts, CORS settings, and rate-limit integration points are configured in backend infrastructure. Secure-cookie settings are present as placeholders for future cookie-based session integration, but this sprint uses Bearer tokens only.
