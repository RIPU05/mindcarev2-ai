# Deployment Architecture

The repository includes Dockerfiles for frontend and backend plus a root `docker-compose.yml` for local orchestration.

## Environments

- Local: Docker Compose or separate frontend/backend dev servers.
- Preview: isolated deployment per branch with preview database credentials.
- Production: managed frontend hosting, containerized FastAPI runtime, Supabase PostgreSQL, object storage, and background workers.

## Configuration

Environment variables should be documented through `.env.example` files. Secrets must never be committed. Provider keys, Supabase credentials, storage credentials, and webhook secrets should be scoped per environment.

## Observability

Future deployment should include structured logs, request IDs, job IDs, provider latency metrics, and safety-stage monitoring.
