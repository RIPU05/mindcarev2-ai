# Alembic

Alembic is configured for async SQLAlchemy and Supabase-compatible PostgreSQL.

No migrations are generated in this sprint. Future migration revisions should be created from `backend/` with:

```bash
alembic revision --autogenerate -m "description"
```
