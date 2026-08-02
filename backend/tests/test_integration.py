import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient

from app.auth.dependencies import get_current_user
from app.models.users import User


@pytest.fixture
def mock_user():
    return User(
        id=uuid.UUID("11111111-1111-1111-1111-111111111111"),
        email="test@example.com"
    )


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
        "source": "manual"
    }
    with patch("asyncio.create_task"):
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
    with patch("asyncio.create_task"):
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
        }
    }
    mock_claims = {
        "sub": "11111111-1111-1111-1111-111111111111",
        "email": "test@example.com",
        "user_metadata": {"display_name": "Test User"}
    }

    with patch("app.auth.client.auth_client.sign_in_with_password", AsyncMock(return_value=mock_supabase_res)), \
         patch("app.auth.client.auth_client.verify_token", AsyncMock(return_value=mock_claims)):
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
        }
    }
    mock_claims = {
        "sub": "11111111-1111-1111-1111-111111111111",
        "email": "new@example.com",
        "user_metadata": {"display_name": "New User"}
    }

    with patch("app.auth.client.auth_client.sign_up", AsyncMock(return_value=mock_supabase_res)), \
         patch("app.auth.client.auth_client.verify_token", AsyncMock(return_value=mock_claims)):
        payload = {
            "email": "new@example.com",
            "password": "securepassword",
            "display_name": "New User"
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
        "user_metadata": {"display_name": "Test User"}
    }

    with patch("app.auth.client.auth_client.refresh_session", AsyncMock(return_value=mock_supabase_res)), \
         patch("app.auth.client.auth_client.verify_token", AsyncMock(return_value=mock_claims)):
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
    from app.main import app
    from app.auth.dependencies import get_current_user
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
    from app.main import app
    from app.auth.dependencies import get_current_user
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

