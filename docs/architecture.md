# MindCare AI Architecture Specification

This document details the system design, RAG, and instrumentation details for MindCare AI v2.

---

## 1. Complete System Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Client Application
    participant GW as FastAPI Gateway
    participant MW as Security Middleware
    participant SRV as Orchestrator Service
    participant DB as Postgres + pgvector
    participant AI as AI Reliable Provider Wrapper

    User->>GW: POST /journal (Payload + Auth Token)
    GW->>MW: Verify JWT Token Claims
    MW-->>GW: Token Validated (Inject user_id)
    GW->>SRV: Process Journal Entry
    SRV->>DB: Fetch Similar Entries (RAG Query)
    DB-->>SRV: Return Historic Matches
    SRV->>AI: analyze_text() (Safety screening)
    AI-->>SRV: SafetyResult (Risk Level)
    SRV->>AI: analyze_text() (Emotion metrics)
    AI-->>SRV: EmotionResult (Primary Mood)
    SRV->>AI: generate_reflection() (With context)
    AI-->>SRV: ReflectionResult (Suggestions)
    SRV->>DB: Save Journal & Analysis records
    DB-->>SRV: Commit success
    SRV-->>GW: Return Journal + Reflection Analysis
    GW-->>User: 201 Created Response
```

---

## 2. Authentication Flow

JWT Authentication utilizes access and refresh tokens.

```mermaid
graph TD
    Login[POST /auth/login] -->|Verify hash| DBCheck{Credentials OK?}
    DBCheck -->|No| Unauthorized[401 Unauthorized]
    DBCheck -->|Yes| Issue[Issue JWT Access & Refresh Token]
    Issue --> CacheRefreshToken[Store Refresh Token in Redis Cache]
    
    Request[API Request] -->|With Access Token| AuthMiddleware[Auth Middleware]
    AuthMiddleware -->|Token Valid| HandleRequest[Execute Endpoint Logic]
    AuthMiddleware -->|Token Expired| RequestRefresh[POST /auth/refresh with Refresh Token]
    RequestRefresh --> CheckCache{Refresh Token in Cache?}
    CheckCache -->|Yes| Rotate[Generate New Access + Rotated Refresh Token]
    CheckCache -->|No/Revoked| Reject[401 Session Revoked]
```

---

## 3. RAG Retrieval Pipeline

Our RAG system couples vector matching with chronological fallbacks.

```mermaid
graph TD
    Query[Retrieve Historical Context] --> CheckEmbedding{Generate Query Embedding}
    CheckEmbedding -->|Success| VectorStore[Search pgvector Store]
    CheckEmbedding -->|Cache Hit| RedisCache[Return Vector from Cache]
    VectorStore -->|Vector Match Success| ReturnContext[Form Context payload]
    VectorStore -->|Database Timeout/Failure| ChronoFallback[SqlJournalRetriever Chronological Fallback]
    ChronoFallback -->|Fetch raw SQL records| ReturnContext
```

---

## 4. AI Provider Failover (Circuit Breaker)

Ensures zero downtime by routing across available models.

```mermaid
graph TD
    Request[Request AI Generation] --> CheckGemini{Circuit Breaker Gemini CLOSED?}
    CheckGemini -->|Yes| CallGemini[Call Gemini API]
    CallGemini -->|Succeeds| Success[Return Response]
    CallGemini -->|Fails 5 times| OpenGemini[Open Gemini Circuit]
    
    CheckGemini -->|No / OPEN| CheckOpenAI{Circuit Breaker OpenAI CLOSED?}
    CheckOpenAI -->|Yes| CallOpenAI[Call OpenAI API]
    CallOpenAI -->|Succeeds| Success
    CallOpenAI -->|Fails| OpenOpenAI[Open OpenAI Circuit]
    
    CheckOpenAI -->|No / OPEN| CheckGroq{Check Groq / Claude / Local Ollama}
    CheckGroq --> Success
```

---

## 5. Telemetry & Monitoring Architecture

System indicators trace requests down to operational infrastructure.

- **FastAPI Middleware**: Automatically tracks HTTP latencies (`http_request_duration_seconds`) and response states (`http_requests_total`).
- **OpenTelemetry Tracer**: Wraps retrieval database queries (`rag_retrieve`), embedding processes (`generate_and_store_embedding`), and external provider invocations.
- **Prometheus Scraper**: Polls the `/metrics` endpoint to monitor metrics globally.
- **Grafana Panel Grid**: Displays system indicators on dashboard layouts.
