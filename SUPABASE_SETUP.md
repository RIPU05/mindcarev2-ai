# MindCare AI v2.0 — Supabase Setup & Integration Guide

This document provides step-by-step instructions for configuring Supabase Authentication and linking it with MindCare AI v2.0.

---

## **1. CREATE SUPABASE PROJECT**

1. Sign in to [Supabase Console](https://supabase.com/dashboard).
2. Click **New Project**, enter project name `mindcare-ai-prod`, select region, and generate a strong database password.

---

## **2. CONFIGURE AUTHENTICATION SETTINGS**

1. In Supabase Dashboard, navigate to **Authentication** -> **Providers** -> **Email**.
   - Enable **Email provider**.
   - (Optional) Enable **Confirm Email** for production security.
2. Under **URL Configuration**:
   - **Site URL**: `https://your-domain.com`
   - **Redirect URLs**:
     - `https://your-domain.com/login`
     - `https://your-domain.com/auth/callback`
     - `https://your-domain.com/reset-password`

---

## **3. EXTRACT API & JWT SECRETS**

Navigate to **Project Settings** -> **API**:

1. **Project URL**: `https://<project-ref>.supabase.co`
   - Use as `SUPABASE_URL` in backend `.env`
   - Use as `NEXT_PUBLIC_SUPABASE_URL` in frontend `.env.local`
2. **`anon` `public` key**:
   - Use as `SUPABASE_ANON_KEY` in backend `.env`
   - Use as `NEXT_PUBLIC_SUPABASE_ANON_KEY` in frontend `.env.local`
3. **`service_role` `secret` key**:
   - Use as `SUPABASE_SERVICE_ROLE_KEY` in backend `.env` (**NEVER EXPOSE TO FRONTEND**)
4. **JWT Secret** (Under JWT Settings):
   - Use as `SUPABASE_JWT_SECRET` in backend `.env`

---

## **4. OPTIONAL: RUN LIVE SUPABASE AUTOMATED TEST**

To verify live authentication against your non-production Supabase environment:

```bash
cd backend
export SUPABASE_TEST_URL="https://<project-ref>.supabase.co"
export SUPABASE_TEST_ANON_KEY="<your-anon-key>"
export SUPABASE_TEST_EMAIL="testuser@example.com"
export SUPABASE_TEST_PASSWORD="TestPassword123!"

pytest tests/test_supabase_live.py
```
