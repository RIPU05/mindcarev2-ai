# ADR 003: Supabase PostgreSQL Data Architecture

## Problem

MindCare AI needs relational integrity, user-scoped access, auditability, and structured analytics for sensitive mental health data.

## Decision

Use Supabase PostgreSQL as the system of record. Prefer UUIDv7 identifiers, strong enums, separate media metadata, async analysis jobs, dashboard caches, audit logs, and journal revisions.

## Alternatives

- Local file storage and CSV datasets.
- Document database for all user and analysis data.
- Direct model-output storage without normalized analysis and reflection records.

## Consequences

The relational model supports integrity, reporting, and governance. It requires careful migrations and row-level security in future implementation phases.
