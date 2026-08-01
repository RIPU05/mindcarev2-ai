# Database Architecture

Supabase PostgreSQL is the target database. This document describes architecture only and intentionally does not contain SQL migrations.

## ID Strategy

Use UUIDv7 for primary keys where supported by the application layer or database extension strategy. UUIDv7 preserves global uniqueness while improving index locality because timestamp-ordered values reduce random B-tree writes compared with UUIDv4. It also simplifies event ordering without exposing sequential integer counts.

## Strong Enums

- `status`: lifecycle state for users, conversations, jobs, and analyses. Values should be scoped per entity when semantics differ.
- `risk_level`: safety level produced by screening and analysis, such as `unknown`, `low`, `moderate`, and `high`.
- `role`: participant role in assistant conversations, such as `user`, `assistant`, and `system`.
- `source`: origin of journals or events, such as `manual`, `imported`, and `voice`.
- `input_type`: analysis input category, such as `text`, `audio`, and `journal`.
- `streak_type`: dashboard streak category, such as `journal` and `mood_checkin`.

Strong enums prevent drift between frontend, backend, and database contracts. Application schemas already model these values in `backend/app/schemas/enums.py`.

## Core Tables

### ai_reflections

Stores generated reflective content separate from raw analysis.

- `id`
- `journal_id`
- `analysis_id`
- `summary`
- `themes`
- `reflection`
- `suggestions`
- `follow_up_questions`
- `provider`
- `model`
- `created_at`

### media_files

Stores metadata for uploaded media. Analyses should reference `media_files.id` instead of storing provider-specific paths directly.

- `id`
- `user_id`
- `storage_path`
- `mime_type`
- `duration`
- `size`
- `checksum`
- `created_at`

### analysis_jobs

Tracks async analysis execution.

- `id`
- `analysis_id`
- `status`
- `progress`
- `worker`
- `error`
- `queued_at`
- `started_at`
- `finished_at`

### dashboard_cache

Stores derived dashboard aggregates.

- `user_id`
- `week`
- `month`
- `average_mood`
- `journal_count`
- `streak`
- `updated_at`

Cache invalidation should occur when journals, moods, analyses, or reflections are created, updated, deleted, or reprocessed. Use user-scoped invalidation for the affected week and month rather than global cache resets.

### audit_logs

Records security and data-access events.

- `id`
- `user_id`
- `action`
- `entity`
- `entity_id`
- `ip`
- `user_agent`
- `timestamp`

## Journal Versioning

Prefer a `journal_revisions` table over overwriting historical content. Mental health journaling benefits from auditability, recovery, and traceable AI results. Revisions should store immutable snapshots linked to the journal and actor, while the main `journals` table keeps the latest editable state.

## Migration Workflow

Alembic is configured under `backend/alembic.ini` with async SQLAlchemy support in `backend/alembic/env.py`. Metadata is discovered from `app.db.base.Base` after importing `app.models`, so future ORM models are included in autogenerate when they are exported by the model package.

Recommended workflow:

1. Update ORM models.
2. Run `alembic revision --autogenerate -m "description"` from `backend/`.
3. Review generated tables, indexes, constraints, enum changes, and downgrade behavior.
4. Run `alembic upgrade head` against a local or preview PostgreSQL database.
5. Commit reviewed migration files with the model changes.

The initial migration creates the persistence foundation tables only. It does not seed data or implement application behavior.

## Repository Layer

Repositories live under `backend/app/repositories`. The shared repository base owns generic async CRUD operations, soft-delete handling, pagination parameters, sorting, and SQLAlchemy error translation. Domain repository modules bind the generic behavior to concrete ORM models without adding business policy.

Repository usage should stay inside future services or API dependencies. Route handlers should not construct SQLAlchemy statements directly once service layers exist.

## Transaction Flow

`backend/app/db/uow.py` provides a Unit of Work abstraction around `AsyncSession`.

- Entering the context creates or reuses a session.
- `commit()` persists changes and translates SQLAlchemy errors.
- `rollback()` reverts pending changes.
- Exiting with an exception rolls back automatically.
- Owned sessions are closed on exit.

This keeps transaction boundaries explicit while allowing future service orchestration to compose multiple repositories in one transaction.

## Soft Delete Strategy

ORM models include `deleted_at` where records may need recovery, auditability, or privacy review. Repository `delete()` sets `deleted_at` when the model supports it. List operations exclude soft-deleted records by default and can opt into `include_deleted`.

Hard deletes remain possible for tables without `deleted_at` or future data-retention workflows, but product code should prefer soft deletes unless legal or operational requirements demand physical deletion.
