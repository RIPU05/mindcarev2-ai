# MindCare AI v2.0 — Production Deployment & Operations Guide

This guide outlines the production deployment architecture, step-by-step infrastructure provisioning, environment variable secrets configuration, database migrations, Supabase integration, audio worker setup, and SSL domain configuration for **MindCare AI v2.0**.

---

## **1. PRODUCTION DEPLOYMENT ARCHITECTURE**

```
                     ┌──────────────────────────────────────────────┐
                     │          Public User Browser / Client         │
                     └──────────────────────┬───────────────────────┘
                                            │ HTTPS / WSS
                                            ▼
                    ┌────────────────────────────────────────────────┐
                    │  Frontend Hosting (Vercel / Cloudflare Pages)  │
                    │  - Next.js 15 App Router                       │
                    │  - Static Prerendering & Client Auth Hooks     │
                    └───────────────────────┬────────────────────────┘
                                            │ HTTPS API Calls (/api/v1/*)
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  Backend Infrastructure (Render / Fly.io / AWS ECS / DigitalOcean App Platform)        │
│                                                                                        │
│   ┌─────────────────────────────────────┐      ┌────────────────────────────────────┐  │
│   │  FastAPI Production Server          │      │  Standalone Audio Worker Process   │  │
│   │  - uvicorn app.main:app             │      │  - python -m app.worker            │  │
│   │  - GZip, Security, RateLimiting     │      │  - Listens on Redis Queue          │  │
│   │  - Gemini / Reliable AI Orchestrator│      │  - Processes wav2vec2 Model        │  │
│   └──────────────────┬──────────────────┘      └─────────────────┬──────────────────┘  │
└──────────────────────┼───────────────────────────────────────────┼─────────────────────┘
                       │                                           │
                       ├─────────────────────┬─────────────────────┤
                       │                     │                     │
                       ▼                     ▼                     ▼
             ┌───────────────────┐  ┌──────────────────┐  ┌────────────────┐
             │ Managed PostgreSQL│  │ Managed Redis    │  │ Supabase Auth  │
             │ (pgvector engine) │  │ (Task Queue)     │  │ (OAuth / JWT)  │
             └───────────────────┘  └──────────────────┘  └────────────────┘
```

---

## **2. REQUIRED PRODUCTION ENVIRONMENT VARIABLES**

### **Frontend Environment (.env.production / Vercel Environment)**
> [!IMPORTANT]  
> Never include backend service role keys or database credentials in frontend environment variables.

| Variable Name | Description | Example Value |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_NAME` | Public Application Title | `MindCare AI` |
| `NEXT_PUBLIC_API_BASE_URL` | Production Backend HTTPS API Base URL | `https://api.mindcare.ai/api/v1` |
| `NEXT_PUBLIC_SUPABASE_URL` | Production Supabase Project URL | `https://xyzproject.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase Anon API Key | `eyJhbGciOi...` |
| `NEXT_PUBLIC_API_TIMEOUT_MS` | API Request Timeout (Milliseconds) | `12000` |
| `NEXT_PUBLIC_API_RETRIES` | Max Request Retries | `1` |

### **Backend Environment (.env / Render Secret Environment)**

| Variable Name | Description | Example Value |
| :--- | :--- | :--- |
| `APP_NAME` | Service Name | `MindCare AI API` |
| `APP_ENV` | Environment Type | `production` |
| `DEBUG` | Debug Mode (Must be `False` in Prod) | `False` |
| `API_PREFIX` | API Path Prefix | `/api/v1` |
| `BACKEND_CORS_ORIGINS` | Comma-Separated Allowed Frontend Origins | `https://mindcare.ai,https://www.mindcare.ai` |
| `DATABASE_URL` | Production Async PostgreSQL Connection String | `postgresql+asyncpg://user:pass@host:5432/mindcare` |
| `REDIS_URL` | Production Redis URL (For Audio Worker Queue) | `redis://user:pass@host:6379/0` |
| `JWT_SECRET` | Secret Key for Internal Signings | `<generate-32char-random-key>` |
| `SUPABASE_URL` | Supabase Project Host URL | `https://xyzproject.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase Anon Key | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend-Only Service Role Key | `eyJhbGciOi...` |
| `SUPABASE_JWT_SECRET` | Supabase Project JWT Secret Key | `<supabase-jwt-secret>` |
| `GEMINI_API_KEY` | Production Google Gemini API Key | `AIzaSy...` |
| `DEFAULT_AI_PROVIDER` | AI Provider Name | `gemini` |

---

## **3. STEP-BY-STEP PRODUCTION DEPLOYMENT**

### **Step 1: Provision Managed Database & Redis Services**
1. Provision a PostgreSQL 15+ database instance (e.g. Render Postgres / Supabase Postgres / AWS RDS) with the `pgvector` extension enabled.
2. Provision a Redis instance (e.g. Render Redis / Upstash Redis / Redis Enterprise).

### **Step 2: Run Database Migrations**
Run Alembic database migrations against the production PostgreSQL instance prior to launching the FastAPI application:
```bash
cd backend
export DATABASE_URL="postgresql+asyncpg://<user>:<password>@<db-host>:5432/mindcare"
alembic upgrade head
```

### **Step 3: Deploy Backend FastAPI & Audio Worker**
Deploy the Docker container image or native Python environment using the following entrypoints:

- **Web Server Service**:
  ```bash
  uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
  ```
- **Audio Worker Queue Service**:
  ```bash
  python -m app.worker
  ```

### **Step 4: Deploy Frontend (Next.js)**
1. Connect repository to Vercel, Cloudflare Pages, or Render Static Web Service.
2. Set Build Command: `npm run build` inside `frontend/` directory.
3. Configure `NEXT_PUBLIC_API_BASE_URL` pointing to your production backend HTTPS endpoint.

---

## **4. SUPABASE AUTHENTICATION CONFIGURATION**

1. Go to your **Supabase Dashboard** -> **Authentication** -> **URL Configuration**.
2. **Site URL**: `https://mindcare.ai`
3. **Redirect URLs**:
   - `https://mindcare.ai/auth/callback`
   - `https://mindcare.ai/login`
   - `https://mindcare.ai/reset-password`
4. Under **Settings** -> **API**, copy `Project URL`, `anon key`, `service_role key`, and `JWT Secret`.

---

## **5. DOMAINS, SSL & HEALTHCHECKS**

- **Frontend Domain**: `https://mindcare.ai`
- **Backend API Domain**: `https://api.mindcare.ai`
- **Backend Liveness Probe**: `GET https://api.mindcare.ai/health/live` (Expects HTTP 200 `{"status":"alive"}`)
- **Backend Readiness Probe**: `GET https://api.mindcare.ai/health` (Expects HTTP 200 with DB & Queue status)
