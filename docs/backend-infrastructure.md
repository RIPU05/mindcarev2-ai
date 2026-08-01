# Backend Infrastructure Implementation

This document explains the backend infrastructure modules added for the implementation sprint. It does not describe frontend, authentication, AI inference, Supabase implementation, or business logic.

## `app/db`

- `base.py`: declarative SQLAlchemy base plus shared UUID primary key, timestamp, and soft-delete mixins.
- `database.py`: async SQLAlchemy engine, session factory, connection verification, and shutdown disposal.
- `session.py`: async session dependency generator for FastAPI.

## `app/models`

ORM models define persistence structure only:

- `User`
- `Profile`
- `JournalEntry`
- `MoodAnalysis`
- `AssistantConversation`
- `AssistantMessage`
- `MoodStreak`
- `UserSettings`

Models use UUID identifiers, timestamps, soft-delete fields, PostgreSQL-compatible enums, JSONB metadata fields, relationships, and indexes. They intentionally do not contain business methods.

## `app/repositories`

Repositories provide CRUD skeletons around SQLAlchemy `AsyncSession`. They are intentionally thin and do not enforce domain policy, authorization, AI behavior, or workflow rules.

## `app/dependencies`

Dependency modules expose FastAPI providers for database sessions and repository instances. Future endpoint or service code can depend on these providers without constructing repositories directly.

## `app/exceptions`

The exception hierarchy provides stable application-level errors:

- `ValidationException`
- `NotFoundException`
- `ConflictException`
- `DatabaseException`
- `AIException`
- `AuthenticationException`

FastAPI maps these exceptions to consistent JSON error responses with request IDs.

## `app/core`

- `config.py`: environment-driven settings for app metadata, debug mode, database, CORS, trusted hosts, and Supabase placeholders.
- `logging.py`: structured JSON logging and SQLAlchemy query timing hooks.
- `middleware.py`: request IDs, request logging, security headers, trusted hosts, gzip, and a rate-limit placeholder.

## `app/utils`

Shared helpers cover UUID generation, UTC datetime handling, pagination shapes, and response wrappers. UUIDv7 is represented by a placeholder generator until native runtime support or a vetted dependency is selected.

## Alembic

`backend/alembic.ini` and `backend/alembic/env.py` configure Alembic for async SQLAlchemy. No migrations were generated in this sprint.

## Lifecycle

FastAPI startup configures logging, registers database query timing, verifies database connectivity, and logs startup metadata. Shutdown disposes the async engine and logs graceful termination.
