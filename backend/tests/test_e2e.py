from unittest.mock import AsyncMock, patch
from uuid import UUID

import pytest
from app.models.analysis import MoodAnalysis
from app.models.assistant import AssistantMessage
from app.models.journal import JournalEntry
from app.models.users import User
from app.rag.types import RetrievalSource
from httpx import AsyncClient
from sqlalchemy import select


@pytest.mark.anyio
async def test_complete_e2e_flow(client: AsyncClient, db_session, mock_rag_components):
    # 0. Set up Supabase auth mock responses
    mock_supabase_res = {
        "access_token": "mock_e2e_token",
        "refresh_token": "mock_e2e_refresh",
        "expires_in": 3600,
        "user": {
            "id": "22222222-2222-2222-2222-222222222222",
            "email": "e2e_user@example.com",
        },
    }
    mock_claims = {
        "sub": "22222222-2222-2222-2222-222222222222",
        "email": "e2e_user@example.com",
        "user_metadata": {"display_name": "E2E User"},
    }

    # Remove dependency overrides for auth so we run the actual auth route logic
    from app.main import app

    app.dependency_overrides.clear()

    with (
        patch("app.auth.client.auth_client.sign_up", AsyncMock(return_value=mock_supabase_res)),
        patch(
            "app.auth.client.auth_client.sign_in_with_password",
            AsyncMock(return_value=mock_supabase_res),
        ),
        patch("app.auth.client.auth_client.verify_token", AsyncMock(return_value=mock_claims)),
    ):

        # 1. User Registration
        reg_payload = {
            "email": "e2e_user@example.com",
            "password": "e2e_secure_password",
            "display_name": "E2E User",
        }
        reg_res = await client.post("/api/v1/auth/register", json=reg_payload)
        assert reg_res.status_code == 201
        assert reg_res.json()["access_token"] == "mock_e2e_token"

        # Verify DB state: User must exist in local database
        stmt = select(User).where(User.email == "e2e_user@example.com")
        user = (await db_session.scalars(stmt)).first()
        assert user is not None
        assert user.email == "e2e_user@example.com"
        user_id = user.id

        # 2. User Login
        login_payload = {
            "email": "e2e_user@example.com",
            "password": "e2e_secure_password",
        }
        login_res = await client.post("/api/v1/auth/login", json=login_payload)
        assert login_res.status_code == 200
        assert login_res.json()["access_token"] == "mock_e2e_token"

        # 3. Create Journal Entry
        headers = {"Authorization": "Bearer mock_e2e_token"}
        journal_payload = {
            "content": "Today I accomplished all my tasks and feel great.",
            "title": "Feeling Productive",
            "tags": ["productive", "happy"],
            "source": "manual",
        }
        journal_res = await client.post("/api/v1/journal", json=journal_payload, headers=headers)
        assert journal_res.status_code == 201
        journal_id = journal_res.json()["id"]

        # Verify DB state: Journal entry must exist and link to user
        journal_stmt = select(JournalEntry).where(JournalEntry.id == UUID(journal_id))
        journal = (await db_session.scalars(journal_stmt)).first()
        assert journal is not None
        assert journal.user_id == user_id
        assert journal.title == "Feeling Productive"

        # 4. Run Text Analysis
        analysis_payload = {
            "text": "Today I accomplished all my tasks and feel great.",
            "journal_id": str(journal_id),
        }
        analysis_res = await client.post(
            "/api/v1/analysis/text", json=analysis_payload, headers=headers
        )
        assert analysis_res.status_code in [200, 202]

        # Verify DB state: MoodAnalysis record must exist and match expectations
        analysis_stmt = select(MoodAnalysis).where(MoodAnalysis.user_id == user_id)
        analysis = (await db_session.scalars(analysis_stmt)).first()
        assert analysis is not None
        assert analysis.status == "completed"
        assert analysis.primary_mood == "anxiety"  # from conftest mock response
        assert analysis.journal_entry_id == UUID(journal_id)

        # 5. Store Embeddings (simulate task trigger)
        from app.rag.embeddings import generate_and_store_embedding

        await generate_and_store_embedding(
            text="Today I accomplished all my tasks and feel great.",
            source=RetrievalSource.JOURNAL,
            document_id=str(journal_id),
            user_id=user_id,
            metadata={"title": "Feeling Productive"},
        )
        # Verify vector store upsert was called on mock bundle
        assert mock_rag_components.vector_store.upsert.called

        # 6. Assistant Conversation
        chat_payload = {
            "message": "I need some advice on staying productive.",
            "journal_id": str(journal_id),
        }
        chat_res = await client.post("/api/v1/assistant/chat", json=chat_payload, headers=headers)
        assert chat_res.status_code == 200
        chat_data = chat_res.json()
        assert "content" in chat_data
        conversation_id = chat_data["conversation_id"]

        # Verify DB state: Message history saved
        msg_stmt = select(AssistantMessage).where(
            AssistantMessage.conversation_id == UUID(conversation_id)
        )
        messages = (await db_session.scalars(msg_stmt)).all()
        assert len(messages) >= 2  # user and assistant messages
