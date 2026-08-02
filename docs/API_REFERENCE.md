# MindCare AI v2 API Reference

This document catalogs every API endpoint, its required payloads, request/response models, authorization mechanisms, and example JSON payloads.

---

## 1. Authentication Endpoints

### 1.1 POST `/api/v1/auth/register`
Creates a new user profile.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "strongpassword123",
    "username": "user1"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "id": "84852924-dc08-410a-9d9f-16c478a5e552",
    "email": "user@example.com",
    "username": "user1",
    "created_at": "2026-08-01T12:00:00Z"
  }
  ```

### 1.2 POST `/api/v1/auth/login`
Authenticates a user and returns access/refresh JWT tokens.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "strongpassword123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "refresh_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "expires_in": 1800
  }
  ```

### 1.3 POST `/api/v1/auth/logout`
Revokes the current user's session by blacklisting or deleting their refresh token.
- **Headers**: `Authorization: Bearer <access_token>`
- **Response (200 OK)**:
  ```json
  {
    "message": "Successfully logged out"
  }
  ```

### 1.4 POST `/api/v1/auth/refresh`
Refreshes an expired access token using a valid refresh token.
- **Request Body**:
  ```json
  {
    "refresh_token": "eyJhbGciOi..."
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "expires_in": 1800
  }
  ```

---

## 2. Analysis & Journal Endpoints

### 2.1 POST `/api/v1/analysis/text`
Executes security screening, sentiment categorization, and mood profiling on raw text.
- **Headers**: `Authorization: Bearer <access_token>`
- **Request Body**:
  ```json
  {
    "text": "I feel very anxious about my final examinations next week."
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "primary_mood": "anxious",
    "confidence": 0.92,
    "emotions": [
      { "label": "fear", "score": 0.85 },
      { "label": "sadness", "score": 0.3 }
    ],
    "safety": {
      "risk_level": "low",
      "categories": ["none"],
      "requires_escalation": false,
      "rationale": "Exam anxiety is a typical emotional response."
    }
  }
  ```

### 2.2 POST `/api/v1/journal`
Saves a journal entry and automatically queues it for embedding and analysis.
- **Headers**: `Authorization: Bearer <access_token>`
- **Request Body**:
  ```json
  {
    "title": "Exam stress",
    "content": "I feel very anxious about my final examinations next week."
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "id": "c161be22-b918-47fb-9457-4b77f12e5ab8",
    "title": "Exam stress",
    "content": "I feel very anxious about my final examinations next week.",
    "created_at": "2026-08-02T12:00:00Z"
  }
  ```

### 2.3 GET `/api/v1/journal`
Retrieves a paginated list of the current user's journal entries.
- **Headers**: `Authorization: Bearer <access_token>`
- **Response (200 OK)**:
  ```json
  [
    {
      "id": "c161be22-b918-47fb-9457-4b77f12e5ab8",
      "title": "Exam stress",
      "content": "I feel very anxious about my final examinations next week.",
      "created_at": "2026-08-02T12:00:00Z"
    }
  ]
  ```

---

## 3. Operational & Health Endpoints

### 3.1 GET `/health`
Returns a detailed diagnostics report of database connectivity, memory footprint, active provider configs, and RAG status.
- **Response (200 OK)**:
  ```json
  {
    "status": "healthy",
    "version": "2.0.0",
    "details": {
      "database": "healthy",
      "ai_provider": "healthy",
      "rag_vector_store": "healthy",
      "embedding_provider": "healthy",
      "memory_usage": "48.2 MB",
      "uptime": "250.4s",
      "active_provider": "gemini",
      "queue_status": "idle"
    }
  }
  ```

### 3.2 GET `/health/live`
Minimal Liveness check probe.
- **Response (200 OK)**:
  ```json
  {
    "status": "alive"
  }
  ```

### 3.3 GET `/health/ready`
Minimal Readiness check verifying essential dependencies.
- **Response (200 OK)**:
  ```json
  {
    "status": "ready"
  }
  ```

### 3.4 GET `/metrics`
Exposes system indicators in standard Prometheus text format.
- **Response (200 OK)**:
  ```text
  # HELP http_requests_total Total HTTP requests count
  # TYPE http_requests_total counter
  http_requests_total{method="GET",path="/health",status="200"} 12.0
  ```
