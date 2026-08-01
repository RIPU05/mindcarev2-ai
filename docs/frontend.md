# Frontend Architecture

The frontend is a Next.js 15 application under `frontend/` using React 19, TypeScript, Tailwind CSS, shadcn/ui conventions, Framer Motion, TanStack Query, React Hook Form, and Zod.

## Organization

- `src/app`: route groups and application shell.
- `src/components`: reusable UI architecture grouped by purpose.
- `src/features`: future feature modules by product domain.
- `src/lib/api`: API client architecture, errors, query keys, interceptors, and shared types.
- `src/lib/auth`: authentication contracts only.
- `src/providers`: application-wide providers.
- `src/hooks`: reusable hooks, including auth/session placeholders.

## Design System

Reusable components should be composed from shadcn/ui primitives, Tailwind tokens, and domain-specific folders. Feature modules may compose shared components but should avoid owning global primitives.

## Data Fetching

TanStack Query should own server-state caching. Query keys live in `src/lib/api/query-keys.ts`; endpoint functions should remain thin wrappers around the API client.
