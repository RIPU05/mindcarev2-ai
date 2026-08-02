# MindCare AI Production Readiness Checklist

This document outlines the mandatory operational and security validations required to promote the MindCare AI v2 application stack to a live production environment.

---

## 1. Secrets & Environment Configuration

- [ ] **No Hardcoded Secrets**: Ensure all sensitive values are loaded via environment variables or cloud secret managers (e.g. AWS Secrets Manager, GCP Secret Manager).
- [ ] **Production Keys**: Ensure `JWT_SECRET` and `SUPABASE_JWT_SECRET` use cryptographically secure random values (minimum 256-bit).
- [ ] **Secure Database String**: Avoid storing raw database password strings in repository control repositories.

---

## 2. Network & Transport Security

- [ ] **Enforce HTTPS/TLS**: Ensure the API is only accessible over HTTPS. Redirect all HTTP requests to port 443.
- [ ] **Secure Cookies**: Verify `AUTH_COOKIE_SECURE` is set to `True` to prevent token leakage.
- [ ] **CORS Configuration**: Explicitly list production origin domains in `BACKEND_CORS_ORIGINS`. Avoid using `*` wildcards.
- [ ] **Rate Limiting**: Confirm rate limits on `/auth/login` and `/auth/register` endpoints are active to defend against brute force attempts.

---

## 3. Database & Storage Reliability

- [ ] **Database Pooling**: Adjust `DATABASE_POOL_SIZE` and `DATABASE_MAX_OVERFLOW` according to load requirements.
- [ ] **Vector Indexes**: Implement vector index types (e.g. IVFFlat or HNSW) on embedding tables to maintain search performance at scale.
- [ ] **Backup Policy**: Configure automated daily snapshots for database states. Verify recovery procedures.

---

## 4. Monitoring, Observability & Logs

- [ ] **Expose `/metrics` Scraper**: Verify the Prometheus scraper successfully collects metrics from `/metrics`.
- [ ] **JSON Logging Pipeline**: Setup log collectors (e.g. Loki/Promtail) to process standard JSON logs.
- [ ] **OpenTelemetry Exporters**: Verify that OpenTelemetry spans propagate to the central trace dashboard (e.g. Jaeger, Tempo, or Datadog).

---

## 5. Deployment & Container Infrastructure

- [ ] **Non-Root Execution**: Confirm the backend container runs under the system-defined `appuser` user rather than `root`.
- [ ] **Resource Limits**: Set CPU and memory boundaries (limits and requests) inside the Docker orchestration manifest to prevent single container resource depletion.
- [ ] **Graceful Shutdown**: Ensure the container traps SIGTERM and allows active HTTP connections to complete.
