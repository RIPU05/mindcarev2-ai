# MindCare AI Production Observability & Deployment Manual

This document details the configuration, deployment, scaling, and disaster recovery procedures for the MindCare AI v2 production backend stack.

---

## 1. System Architecture

The production environment consists of:
- **FastAPI Backend**: Serving API endpoints with Prometheus and OpenTelemetry instrumentation.
- **Postgres Database**: Relational storage equipped with `pgvector` extension for semantic search indices.
- **Redis Cache**: High-speed lookup cache for text embeddings and session security states.
- **Prometheus Scraper**: Pulls metrics from the backend's `/metrics` endpoint every 15 seconds.
- **Grafana Dashboard**: Visualizes API traffic metrics, latency distribution, circuit breakers, and AI costs.

---

## 2. Observability Metrics & Instrumentation

### 2.1 Prometheus Metrics
The backend exposes the following core metrics at `/metrics`:
- `http_requests_total`: Tracks API status codes and method count.
- `http_request_duration_seconds`: Response latency histogram (p50, p95, p99).
- `ai_request_duration_seconds`: Timing of raw generative LLM queries.
- `ai_token_usage_total`: Input and output tokens consumed.
- `ai_estimated_cost_usd`: Running aggregation of provider dollar expenditures.
- `circuit_breaker_state`: Gauge monitoring health (0 = CLOSED, 1 = HALF-OPEN, 2 = OPEN).

### 2.2 OpenTelemetry Traces
FastAPI requests are automatically auto-instrumented. Custom spans trace down to critical components:
- `generate_and_store_embedding`: Traces cache hits/misses and vector storage writes.
- `rag_retrieve`: Traces composite retriever queries and semantic searches.
- `emotion_analysis` & `safety_screening`: Traces individual downstream AI logic segments.

---

## 3. Logging Pipeline (Loki/Promtail)

Logs are structured as flat JSON records. Below is the standard Promtail configuration snippet to parse these logs:

```yaml
scrape_configs:
  - job_name: mindcare-logs
    static_configs:
      - targets: [localhost]
        labels:
          job: mindcare-backend
          __path__: /var/log/mindcare/*.log
    pipeline_stages:
      - json:
          expressions:
            request_id: request_id
            user_id: user_id
            level: level
            message: message
            latency_ms: latency_ms
```

---

## 4. Disaster Recovery & Provider Failover

The backend features provider failover via `ReliableAIProviderWrapper`. 

### 4.1 Circuit Breaker Policy
- **Threshold**: 5 consecutive errors opens the circuit for that provider.
- **Recovery**: Evaluates a single canary request after a 60-second cooldown (HALF-OPEN).
- **Fallback Order**: If Gemini fails, requests automatically cascade to OpenAI, Anthropic, or Groq sequentially.
