# Changelog

All notable changes to this project will be documented in this file.

---

## [2.0.0] - 2026-08-02

### Added
- **Multi-Agent AI Pipeline**: Implemented sentiment categorization, emotion profiling, safety screening, and reflection summary builders.
- **Circuit Breaker Failover Wrapper**: Added `ReliableAIProviderWrapper` with automatic retries, timeouts, and fallback routing (Gemini -> OpenAI -> Claude -> Groq -> local Ollama).
- **RAG & Semantic Retrieval**: Configured Postgres `pgvector` indexing with fallback to chronological SQL query structures (`SqlCompositeRetriever`).
- **Redis Caching Layer**: Added an embedding cache to skip duplicate text embedding generation calls.
- **Production-grade Authentication**: Configured JWT rotation schemas, token revocation, rate limiting filters, and Argon2 password hashing.
- **Operational Health Checks**: Added `/health`, `/health/live`, and `/health/ready` check routers reporting system performance diagnostics.
- **Prometheus Metrics Endpoint**: Exposes HTTP durations, token footprints, failovers, and USD cost calculations on `/metrics`.
- **OpenTelemetry Tracing**: Trace spans configured across all endpoint execution layers.
- **Docker Production Stack**: Configured multi-stage Docker builds and root docker-compose files.

### Changed
- **Legacy Migration Isolation**: Moved v1 Streamlit model codebase to the `legacy/` directory to preserve functional integrity.
- **CI/CD Integration**: Upgraded GitHub action pipelines to validate formats, types, dependency security scans, and code coverage.
