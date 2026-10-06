import uuid
from unittest.mock import AsyncMock, patch

import pytest
from app.auth.dependencies import get_current_user
from app.models.users import User
from httpx import AsyncClient


@pytest.fixture
def mock_user():
    return User(id=uuid.UUID("11111111-1111-1111-1111-111111111111"), email="test@example.com")


@pytest.fixture(autouse=True)
def override_auth(mock_user):
    async def _mock_current_user():
        return mock_user

    from app.main import app

    app.dependency_overrides[get_current_user] = _mock_current_user
    yield
    if get_current_user in app.dependency_overrides:
        del app.dependency_overrides[get_current_user]


@pytest.mark.anyio
async def test_health_endpoint(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "details" in data
    assert data["details"]["database"] == "healthy"


# 1. Journal Endpoint Integration Tests
@pytest.mark.anyio
async def test_journal_endpoints_success(client: AsyncClient):
    # Test POST /api/v1/journal
    payload = {
        "content": "I feel very anxious about my final exam tomorrow.",
        "title": "Anxiety Check",
        "tags": ["anxiety", "exam"],
        "source": "manual",
    }
    response = await client.post("/api/v1/journal", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["content"] == payload["content"]
    assert data["title"] == payload["title"]

    # Test GET /api/v1/journal (List journals)
    get_response = await client.get("/api/v1/journal?limit=10")
    assert get_response.status_code == 200
    get_data = get_response.json()
    assert "items" in get_data
    assert isinstance(get_data["items"], list)
    assert len(get_data["items"]) >= 1


@pytest.mark.anyio
async def test_journal_creation_invalid_payload(client: AsyncClient):
    # Payload with content too short
    payload = {
        "content": "",
        "title": "Invalid Check",
    }
    response = await client.post("/api/v1/journal", json=payload)
    assert response.status_code == 422


# 2. Text Analysis Endpoint Integration Tests
@pytest.mark.anyio
async def test_mood_analysis_success(client: AsyncClient):
    payload = {"text": "I feel very anxious about tomorrow's exam."}
    response = await client.post("/api/v1/analysis/text", json=payload)
    assert response.status_code in [200, 202]
    data = response.json()
    assert "status" in data


@pytest.mark.anyio
async def test_mood_analysis_invalid_payload(client: AsyncClient):
    payload = {"text": ""}  # Empty text validation check
    response = await client.post("/api/v1/analysis/text", json=payload)
    assert response.status_code == 422


# 3. Assistant Chat Endpoint Integration Tests
@pytest.mark.anyio
async def test_assistant_chat_success(client: AsyncClient):
    payload = {"message": "Hello assistant"}
    response = await client.post("/api/v1/assistant/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "content" in data
    assert "conversation_id" in data


@pytest.mark.anyio
async def test_assistant_chat_invalid_payload(client: AsyncClient):
    payload = {"message": ""}  # Empty message
    response = await client.post("/api/v1/assistant/chat", json=payload)
    assert response.status_code == 422


# 4. Authentication Endpoints Integration Tests
@pytest.mark.anyio
async def test_auth_login_success(client: AsyncClient):
    mock_supabase_res = {
        "access_token": "valid_token",
        "refresh_token": "valid_refresh",
        "expires_in": 3600,
        "user": {
            "id": "11111111-1111-1111-1111-111111111111",
            "email": "test@example.com",
        },
    }
    mock_claims = {
        "sub": "11111111-1111-1111-1111-111111111111",
        "email": "test@example.com",
        "user_metadata": {"display_name": "Test User"},
    }

    with (
        patch(
            "app.auth.client.auth_client.sign_in_with_password",
            AsyncMock(return_value=mock_supabase_res),
        ),
        patch("app.auth.client.auth_client.verify_token", AsyncMock(return_value=mock_claims)),
    ):
        payload = {"email": "test@example.com", "password": "securepassword"}
        response = await client.post("/api/v1/auth/login", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["access_token"] == "valid_token"
        assert data["user"]["email"] == "test@example.com"


@pytest.mark.anyio
async def test_auth_register_success(client: AsyncClient):
    mock_supabase_res = {
        "access_token": "valid_token",
        "refresh_token": "valid_refresh",
        "expires_in": 3600,
        "user": {
            "id": "11111111-1111-1111-1111-111111111111",
            "email": "new@example.com",
        },
    }
    mock_claims = {
        "sub": "11111111-1111-1111-1111-111111111111",
        "email": "new@example.com",
        "user_metadata": {"display_name": "New User"},
    }

    with (
        patch("app.auth.client.auth_client.sign_up", AsyncMock(return_value=mock_supabase_res)),
        patch("app.auth.client.auth_client.verify_token", AsyncMock(return_value=mock_claims)),
    ):
        payload = {
            "email": "new@example.com",
            "password": "securepassword",
            "display_name": "New User",
        }
        response = await client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["access_token"] == "valid_token"


@pytest.mark.anyio
async def test_auth_refresh_success(client: AsyncClient):
    mock_supabase_res = {
        "access_token": "new_access_token",
        "refresh_token": "new_refresh_token",
        "expires_in": 3600,
    }
    mock_claims = {
        "sub": "11111111-1111-1111-1111-111111111111",
        "email": "test@example.com",
        "user_metadata": {"display_name": "Test User"},
    }

    with (
        patch(
            "app.auth.client.auth_client.refresh_session",
            AsyncMock(return_value=mock_supabase_res),
        ),
        patch("app.auth.client.auth_client.verify_token", AsyncMock(return_value=mock_claims)),
    ):
        payload = {"refresh_token": "old_refresh_token"}
        response = await client.post("/api/v1/auth/refresh", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["access_token"] == "new_access_token"


@pytest.mark.anyio
async def test_auth_me_success(client: AsyncClient):
    # Disable autouse auth mock override in FastAPI to test real dependencies flow
    from app.main import app

    original_overrides = dict(app.dependency_overrides)
    app.dependency_overrides.clear()

    mock_claims = {
        "sub": "11111111-1111-1111-1111-111111111111",
        "email": "test@example.com",
    }

    with patch("app.auth.client.auth_client.verify_token", AsyncMock(return_value=mock_claims)):
        headers = {"Authorization": "Bearer some_token"}
        response = await client.get("/api/v1/auth/me", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["email"] == "test@example.com"

    # Restore overrides
    app.dependency_overrides.update(original_overrides)


@pytest.mark.anyio
async def test_auth_me_unauthorized(client: AsyncClient):
    # Disable autouse auth mock override in FastAPI to test real dependencies flow
    from app.main import app

    original_overrides = dict(app.dependency_overrides)
    app.dependency_overrides.clear()

    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401

    # Restore overrides
    app.dependency_overrides.update(original_overrides)


# 5. Profile Endpoints
@pytest.mark.anyio
async def test_profile_endpoints(client: AsyncClient):
    from app.auth.dependencies import get_current_user
    from app.main import app

    original_override = app.dependency_overrides.get(get_current_user)

    unique_id = uuid.uuid4()

    async def _override():
        return User(id=unique_id, email="profile@example.com")

    app.dependency_overrides[get_current_user] = _override

    # GET /api/v1/profile
    response = await client.get("/api/v1/profile")
    assert response.status_code == 200
    data = response.json()
    assert "email" in data
    assert data["display_name"] == "MindCare User"

    # PATCH /api/v1/profile
    payload = {"display_name": "Updated Name", "timezone": "Europe/London"}
    patch_res = await client.patch("/api/v1/profile", json=payload)
    assert patch_res.status_code == 200
    assert patch_res.json()["display_name"] == "Updated Name"
    assert patch_res.json()["timezone"] == "Europe/London"

    if original_override:
        app.dependency_overrides[get_current_user] = original_override
    else:
        del app.dependency_overrides[get_current_user]


# 6. Settings Endpoints
@pytest.mark.anyio
async def test_settings_endpoints(client: AsyncClient):
    from app.auth.dependencies import get_current_user
    from app.main import app

    original_override = app.dependency_overrides.get(get_current_user)

    unique_id = uuid.uuid4()

    async def _override():
        return User(id=unique_id, email="settings@example.com")

    app.dependency_overrides[get_current_user] = _override

    # GET /api/v1/settings
    response = await client.get("/api/v1/settings")
    assert response.status_code == 200
    data = response.json()
    assert "notifications_enabled" in data

    # PATCH /api/v1/settings
    payload = {"notifications_enabled": False}
    patch_res = await client.patch("/api/v1/settings", json=payload)
    assert patch_res.status_code == 200
    assert patch_res.json()["notifications_enabled"] is False

    # POST /api/v1/settings/restore
    restore_res = await client.post("/api/v1/settings/restore")
    assert restore_res.status_code == 200
    assert restore_res.json()["notifications_enabled"] is False

    # DELETE /api/v1/settings
    del_res = await client.delete("/api/v1/settings")
    assert del_res.status_code == 204

    if original_override:
        app.dependency_overrides[get_current_user] = original_override
    else:
        del app.dependency_overrides[get_current_user]


# 7. Dashboard Endpoints
@pytest.mark.anyio
async def test_dashboard_endpoints(client: AsyncClient):
    response = await client.get("/api/v1/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "journal_count" in data
    assert "mood_count" in data


# 8. Moods History Endpoints
@pytest.mark.anyio
async def test_moods_endpoints(client: AsyncClient):
    response = await client.get("/api/v1/moods")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


# 9. Extended Assistant and Analysis GET Endpoints
@pytest.mark.anyio
async def test_extended_mood_analysis_fields(client: AsyncClient):
    payload = {"text": "I feel very anxious about tomorrow's exam."}
    response = await client.post("/api/v1/analysis/text", json=payload)
    assert response.status_code in [200, 202]
    data = response.json()
    assert "reflection" in data
    assert "summary" in data
    assert "themes" in data
    assert "suggestions" in data
    assert "follow_up_questions" in data
    assert isinstance(data["themes"], list)
    assert isinstance(data["suggestions"], list)
    assert isinstance(data["follow_up_questions"], list)


@pytest.mark.anyio
async def test_assistant_get_endpoints(client: AsyncClient):
    # First, generate a chat conversation
    chat_payload = {"message": "Let's start a test conversation"}
    chat_response = await client.post("/api/v1/assistant/chat", json=chat_payload)
    assert chat_response.status_code == 200
    chat_data = chat_response.json()
    conv_id = chat_data["conversation_id"]

    # 1. GET /api/v1/assistant/conversations (List conversations)
    list_response = await client.get("/api/v1/assistant/conversations")
    assert list_response.status_code == 200
    list_data = list_response.json()
    assert "items" in list_data
    assert "total" in list_data
    assert list_data["total"] >= 1
    assert any(item["id"] == conv_id for item in list_data["items"])

    # 2. GET /api/v1/assistant/conversations/{conversation_id} (Get conversation details)
    get_response = await client.get(f"/api/v1/assistant/conversations/{conv_id}")
    assert get_response.status_code == 200
    get_data = get_response.json()
    assert get_data["id"] == conv_id
    assert "title" in get_data
    assert "status" in get_data

    # 3. GET /api/v1/assistant/conversations/{conversation_id}/messages (Get message history)
    msg_response = await client.get(f"/api/v1/assistant/conversations/{conv_id}/messages")
    assert msg_response.status_code == 200
    msg_data = msg_response.json()
    assert "items" in msg_data
    assert "total" in msg_data
    assert msg_data["total"] >= 2  # User message and assistant response
    assert msg_data["items"][0]["role"] == "user"
    assert msg_data["items"][1]["role"] == "assistant"

    # 4. GET conversation 404 check
    fake_id = uuid.uuid4()
    bad_response = await client.get(f"/api/v1/assistant/conversations/{fake_id}")
    assert bad_response.status_code == 404

    # 5. GET messages 404 check
    bad_msg_response = await client.get(f"/api/v1/assistant/conversations/{fake_id}/messages")
    assert bad_msg_response.status_code == 404


@pytest.mark.anyio
async def test_health_live_endpoint_with_custom_host(client: AsyncClient):
    # Verify GET /health/live returns HTTP 200 even with cloud host headers (Render, Vercel, AWS)
    response = await client.get("/health/live", headers={"Host": "mindcare-api-6o53.onrender.com"})
    assert response.status_code == 200
    assert response.json() == {"status": "alive"}

    # Verify /api/v1/health/live also returns HTTP 200
    prefixed_res = await client.get("/api/v1/health/live", headers={"Host": "mindcare-api-6o53.onrender.com"})
    assert prefixed_res.status_code == 200
    assert prefixed_res.json() == {"status": "alive"}

