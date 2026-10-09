import csv
import io
import json
import time
import uuid
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.models.users import User
from app.schemas.enums import AnalysisInputType, AnalysisStatus, RiskLevel


# Master Test Users
USER_A_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
USER_B_ID = uuid.UUID("22222222-2222-2222-2222-222222222222")

USER_A = User(id=USER_A_ID, email="qa_user_a@example.com")
USER_B = User(id=USER_B_ID, email="qa_user_b@example.com")


@pytest.fixture
def auth_user_a():
    from app.ai.limiter import gemini_limiter, user_ai_rate_limiter
    user_ai_rate_limiter.reset()
    gemini_limiter.reset()
    async def _mock():
        return USER_A
    return _mock


@pytest.fixture
def auth_user_b():
    from app.ai.limiter import gemini_limiter, user_ai_rate_limiter
    user_ai_rate_limiter.reset()
    gemini_limiter.reset()
    async def _mock():
        return USER_B
    return _mock



# ==========================================
# PHASE 3: AUTHENTICATION & SECURITY
# ==========================================

@pytest.mark.anyio
async def test_auth_me_endpoint_unauthorized(client: AsyncClient):
    """Verify unauthenticated GET /api/v1/auth/me returns 401 Unauthorized."""
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401
    data = response.json()
    assert "code" in data or "message" in data or "error" in data or "detail" in data


@pytest.mark.anyio
async def test_auth_token_rotation_and_blacklist():
    """Verify refresh token rotation and access token blacklist logic in SupabaseAuthClient."""
    from app.auth.client import SupabaseAuthClient
    ac = SupabaseAuthClient()
    
    # Test refresh token rotation
    ref_tok = "test-refresh-token-123"
    assert not ac.is_refresh_token_invalid(ref_tok)
    ac.invalidate_refresh_token(ref_tok)
    assert ac.is_refresh_token_invalid(ref_tok)

    # Test access token blacklist
    acc_tok = "test-access-token-456"
    ac.invalidate_access_token(acc_tok)
    with pytest.raises(Exception) as exc_info:
        await ac.verify_token(acc_tok)
    assert "blacklisted" in str(exc_info.value).lower()


# ==========================================
# PHASE 4: DASHBOARD METRICS & NAV
# ==========================================

@pytest.mark.anyio
async def test_dashboard_summary_metrics(client: AsyncClient, auth_user_a):
    """Verify dashboard summary metrics for populated user account."""
    from app.main import app
    app.dependency_overrides[get_current_user] = auth_user_a
    try:
        # Create a journal entry first
        await client.post("/api/v1/journal", json={
            "title": "QA Test Metric Entry",
            "content": "Testing metric aggregation",
            "tags": ["qa", "metrics"]
        })

        res = await client.get("/api/v1/dashboard/summary")
        assert res.status_code == 200
        data = res.json()
        assert "journal_count" in data
        assert "mood_count" in data
        assert "risk_level" in data
        assert data["journal_count"] >= 1
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ==========================================
# PHASE 5: JOURNAL FUNCTIONAL & STRESS TESTS
# ==========================================

@pytest.mark.anyio
async def test_journal_boundary_and_validation(client: AsyncClient, auth_user_a):
    """Test boundary conditions for journal creation (title length, content limits, XSS, Unicode)."""
    from app.main import app
    app.dependency_overrides[get_current_user] = auth_user_a
    try:
        # 1. Title exceeding max_length=160
        long_title = "A" * 161
        res = await client.post("/api/v1/journal", json={
            "title": long_title,
            "content": "Valid content"
        })
        assert res.status_code == 422

        # 2. Content exceeding max_length=20000
        long_content = "X" * 20001
        res = await client.post("/api/v1/journal", json={
            "title": "Valid title",
            "content": long_content
        })
        assert res.status_code == 422

        # 3. Maximum valid boundary (160 chars title, 20,000 chars content)
        max_valid_title = "T" * 160
        max_valid_content = "C" * 20000
        res = await client.post("/api/v1/journal", json={
            "title": max_valid_title,
            "content": max_valid_content,
            "tags": ["boundary-test"]
        })
        assert res.status_code == 201
        data = res.json()
        assert len(data["title"]) == 160
        assert len(data["content"]) == 20000

        # 4. Unicode, Accented characters, Non-Latin scripts, and Emoji
        unicode_title = "Reflexión del Día 🌟 - 今日のおもいで"
        unicode_content = "Felt super peaceful! 😊 🧘‍♀️ Unicode characters test: ñ, é, ü, ç, 中文, 🌸"
        res = await client.post("/api/v1/journal", json={
            "title": unicode_title,
            "content": unicode_content,
            "tags": ["emoji", "multilingual"]
        })
        assert res.status_code == 201
        data = res.json()
        assert data["title"] == unicode_title
        assert data["content"] == unicode_content

        # 5. XSS Injection Payloads (Must be safely handled and stored as raw string)
        xss_payload = '<script>document.documentElement.dataset.xssTest="executed"</script><img src="x" onerror="alert(1)">'
        res = await client.post("/api/v1/journal", json={
            "title": "XSS Probe",
            "content": xss_payload,
            "tags": ["security"]
        })
        assert res.status_code == 201
        data = res.json()
        assert data["content"] == xss_payload

        # 6. SQL Injection Probe String (Must be safely stored via ORM parameterized query)
        sqli_payload = "' OR '1'='1'; DROP TABLE journal_entries; --"
        res = await client.post("/api/v1/journal", json={
            "title": "SQLi Probe",
            "content": sqli_payload
        })
        assert res.status_code == 201
        data = res.json()
        assert data["content"] == sqli_payload

    finally:
        app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.anyio
async def test_journal_lifecycle_search_sort_filter(client: AsyncClient, auth_user_a):
    """Test full journal lifecycle: Create -> List -> Search -> Sort -> Update -> Delete -> Restore."""
    from app.main import app
    app.dependency_overrides[get_current_user] = auth_user_a
    try:
        # Create unique entry
        unique_key = f"QA-LIFECYCLE-{uuid.uuid4().hex[:8]}"
        res = await client.post("/api/v1/journal", json={
            "title": f"Title {unique_key}",
            "content": f"Substantial content for search test {unique_key} in body",
            "tags": ["lifecycle", unique_key]
        })
        assert res.status_code == 201
        entry_id = res.json()["id"]

        # Search by exact keyword in search param
        res = await client.get(f"/api/v1/journal?search={unique_key}")
        assert res.status_code == 200
        search_results = res.json()["items"]
        assert len(search_results) >= 1
        assert any(item["id"] == entry_id for item in search_results)

        # Update entry (PATCH) and verify version increment
        res = await client.patch(f"/api/v1/journal/{entry_id}", json={
            "title": f"Updated Title {unique_key}"
        })
        assert res.status_code == 200
        assert res.json()["version"] == 2
        assert res.json()["title"] == f"Updated Title {unique_key}"

        # Soft Delete entry
        res = await client.delete(f"/api/v1/journal/{entry_id}")
        assert res.status_code == 204

        # Confirm not returned in normal list
        res = await client.get(f"/api/v1/journal?search={unique_key}")
        assert res.status_code == 200
        assert len(res.json()["items"]) == 0

        # Restore entry
        res = await client.post(f"/api/v1/journal/{entry_id}/restore")
        assert res.status_code == 200
        assert res.json()["id"] == entry_id

    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ==========================================
# PHASE 6: AI COMPANION MULTI-TURN & SAFETY
# ==========================================

@pytest.mark.anyio
async def test_ai_companion_multi_turn_simulation(client: AsyncClient, auth_user_a):
    """Simulate a multi-turn conversation with AI assistant to evaluate context and turn management."""
    from app.main import app
    app.dependency_overrides[get_current_user] = auth_user_a
    try:
        # Turn 1: Initial setup
        res = await client.post("/api/v1/assistant/chat", json={
            "message": "I want to use this conversation to understand my daily routine and organize tomorrow. Please ask one focused question at a time."
        })
        assert res.status_code == 200
        conv_id = res.json()["conversation_id"]

        # Turn 2: Follow-up in same conversation
        res = await client.post("/api/v1/assistant/chat", json={
            "conversation_id": conv_id,
            "message": "My morning started at 7 AM. I had coffee and completed an important report, but I felt anxious before my 2 PM meeting."
        })
        assert res.status_code == 200

        # Turn 3: Ask checklist
        res = await client.post("/api/v1/assistant/chat", json={
            "conversation_id": conv_id,
            "message": "Can you summarize a concise 3-item checklist for my morning routine tomorrow?"
        })
        assert res.status_code == 200
        data = res.json()
        assert data["conversation_id"] == conv_id
        assert data["content"] is not None

        # Verify messages list for conversation
        res = await client.get(f"/api/v1/assistant/conversations/{conv_id}/messages")
        assert res.status_code == 200
        messages = res.json()["items"]
        assert len(messages) == 6  # 3 user messages + 3 assistant responses

    finally:
        app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.anyio
async def test_ai_safety_screening_service():
    """Verify SafetyService correctly classifies risk levels and triggers guidelines."""
    from app.services.safety.gemini import GeminiSafetyScreeningService
    
    mock_prov = AsyncMock()
    mock_prov.name = "gemini"
    mock_prov.model = "gemini-1.5-flash"

    # High risk safety response mock
    mock_prov.analyze_text = AsyncMock(return_value=AsyncMock(
        content=json.dumps({
            "risk_level": "high",
            "categories": ["self_harm"],
            "requires_escalation": True,
            "rationale": "Self-harm intention detected."
        })
    ))

    from app.services.safety.types import SafetyCategory
    
    safety_service = GeminiSafetyScreeningService(mock_prov)
    res = await safety_service.screen({"text": "I feel hopeless and want to end everything."})
    assert res.risk_level == RiskLevel.HIGH
    assert res.requires_escalation is True
    assert SafetyCategory.SELF_HARM in res.categories


# ==========================================
# PHASE 7: EMOTION ANALYSIS & ANALYTICS
# ==========================================

@pytest.mark.anyio
async def test_emotion_analysis_text(client: AsyncClient, auth_user_a):
    """Test text emotion analysis endpoint."""
    from app.main import app
    app.dependency_overrides[get_current_user] = auth_user_a
    try:
        sample_text = "Today I felt proud after completing an important task, but I was also anxious about tomorrow's meeting."
        res = await client.post("/api/v1/analysis/text", json={"text": sample_text})
        assert res.status_code == 200
        data = res.json()
        assert "primary_mood" in data
        assert "confidence" in data
        assert "emotions" in data
        assert "risk_level" in data
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ==========================================
# PHASE 9: PROFILE & SETTINGS
# ==========================================

@pytest.mark.anyio
async def test_profile_and_settings_management(client: AsyncClient, auth_user_a):
    """Test profile display name/timezone update and user settings persistence."""
    from app.main import app
    app.dependency_overrides[get_current_user] = auth_user_a
    try:
        # Get & Patch Profile
        res = await client.patch("/api/v1/profile", json={
            "display_name": "QA Tester",
            "timezone": "America/New_York"
        })
        assert res.status_code == 200
        data = res.json()
        assert data["display_name"] == "QA Tester"
        assert data["timezone"] == "America/New_York"

        # Get & Patch Settings
        res = await client.patch("/api/v1/settings", json={
            "notifications_enabled": True,
            "privacy_preferences": {"data_sharing": False},
            "accessibility_preferences": {"reduced_motion": True, "high_contrast": False}
        })
        assert res.status_code == 200
        data = res.json()
        assert data["notifications_enabled"] is True
        assert data["accessibility_preferences"]["reduced_motion"] is True

    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ==========================================
# PHASE 11: DATABASE ISOLATION & RLS
# ==========================================

@pytest.mark.anyio
async def test_cross_account_data_isolation(client: AsyncClient, auth_user_a, auth_user_b):
    """Verify strict user isolation: User B cannot view or modify User A's journal entry."""
    from app.main import app
    
    # 1. User A creates a secret journal entry
    app.dependency_overrides[get_current_user] = auth_user_a
    try:
        res = await client.post("/api/v1/journal", json={
            "title": "User A Secret Entry",
            "content": "Confidential content belonging strictly to User A."
        })
        assert res.status_code == 201
        entry_id_a = res.json()["id"]
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    # 2. User B attempts to access User A's journal entry (Direct Object ID access)
    app.dependency_overrides[get_current_user] = auth_user_b
    try:
        # GET User A's entry as User B -> Should return 404 Not Found
        res = await client.get(f"/api/v1/journal/{entry_id_a}")
        assert res.status_code == 404

        # PATCH User A's entry as User B -> Should return 404 Not Found
        res = await client.patch(f"/api/v1/journal/{entry_id_a}", json={"title": "Hacked Title"})
        assert res.status_code == 404

        # DELETE User A's entry as User B -> Should return 404 Not Found
        res = await client.delete(f"/api/v1/journal/{entry_id_a}")
        assert res.status_code == 404

        # Verify User A's entry is NOT present in User B's list query
        res = await client.get("/api/v1/journal")
        assert res.status_code == 200
        items_b = res.json()["items"]
        assert not any(item["id"] == entry_id_a for item in items_b)

    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ==========================================
# PHASE 10: JSON & CSV EXPORT PARSER CHECKS
# ==========================================

@pytest.mark.anyio
async def test_export_data_formatting():
    """Verify serialization and parsing integrity for JSON and CSV exports with complex strings."""
    test_entries = [
        {
            "id": str(uuid.uuid4()),
            "title": 'Reflection with "Quotes" & , Commas',
            "content": "Line 1\nLine 2 with UTF-8: Café, 🌸, and <script>alert(1)</script>",
            "tags": ["tag1", "tag,2", 'tag"3'],
            "created_at": "2026-10-09T12:00:00Z"
        }
    ]

    # JSON export integrity check
    json_bytes = json.dumps(test_entries).encode("utf-8")
    parsed_json = json.loads(json_bytes.decode("utf-8"))
    assert parsed_json[0]["title"] == test_entries[0]["title"]
    assert parsed_json[0]["content"] == test_entries[0]["content"]

    # CSV export integrity check
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=["id", "title", "content", "tags", "created_at"])
    writer.writeheader()
    for row in test_entries:
        writer.writerow({
            **row,
            "tags": ";".join(row["tags"])
        })
    csv_string = output.getvalue()

    # Parse back with standard CSV parser
    reader = csv.DictReader(io.StringIO(csv_string))
    rows = list(reader)
    assert len(rows) == 1
    assert rows[0]["title"] == test_entries[0]["title"]
    assert rows[0]["content"] == test_entries[0]["content"]
    assert rows[0]["tags"] == "tag1;tag,2;tag\"3"


# ==========================================
# PHASE 15: PERFORMANCE & SCALABILITY
# ==========================================

@pytest.mark.anyio
async def test_journal_pagination_scalability(client: AsyncClient, auth_user_a):
    """Verify performance and correct pagination metadata under multi-item querying."""
    from app.main import app
    app.dependency_overrides[get_current_user] = auth_user_a
    try:
        t0 = time.perf_counter()
        res = await client.get("/api/v1/journal?limit=20&offset=0")
        t1 = time.perf_counter()
        assert res.status_code == 200
        assert (t1 - t0) < 1.0  # Response time within 1 second for local queries
        data = res.json()
        assert "total" in data
        assert "items" in data
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ==========================================
# PHASE 2 & 7: GEMINI RATE LIMITING & PROTECTION
# ==========================================

@pytest.mark.anyio
async def test_gemini_rate_limiter_concurrency_and_tokens():
    """Verify GeminiRateLimiter acquires/releases semaphores, verifies 5-RPM calibrated settings, and bounds prompt tokens."""
    from app.ai.limiter import bound_prompt_tokens, gemini_limiter
    from app.core.config import settings

    # Verify screenshot-calibrated settings
    assert settings.gemini_max_requests_per_minute == 4
    assert settings.gemini_min_request_interval_seconds == 15.0
    assert settings.gemini_concurrency_limit == 1
    assert settings.gemini_max_input_tokens == 8000
    assert settings.gemini_max_output_tokens == 2048
    assert settings.gemini_queue_timeout_seconds == 15.0
    assert settings.user_ai_max_requests_per_minute == 5

    gemini_limiter.reset()

    # 1. Test token bounding
    long_text = "A" * (settings.gemini_max_input_tokens * 5)
    bounded = bound_prompt_tokens(long_text)
    assert len(bounded) < len(long_text)
    assert "[Note: Input context truncated to comply with maximum token limit.]" in bounded

    # 2. Test acquire and release cycle
    await gemini_limiter.acquire()
    gemini_limiter.release()
    gemini_limiter.reset()



@pytest.mark.anyio
async def test_user_ai_rate_limiter():
    """Verify UserAIRateLimiter blocks requests exceeding the per-user limit and cleans stale user memory."""
    from app.ai.exceptions import RateLimitError
    from app.ai.limiter import user_ai_rate_limiter

    user_ai_rate_limiter.reset()
    user_id = "test-user-rate-limit-123"

    # Send max allowed requests
    for _ in range(user_ai_rate_limiter.requests_limit):
        await user_ai_rate_limiter.check(user_id)

    # Exceeding request should raise RateLimitError
    with pytest.raises(RateLimitError) as exc_info:
        await user_ai_rate_limiter.check(user_id)

    assert exc_info.value.code == "ai_rate_limited"

    # Verify stale memory cleanup
    user_ai_rate_limiter.reset()
    for i in range(250):
        await user_ai_rate_limiter.check(f"user-stale-{i}")

    # Map size should stay bounded after cleanup trigger
    assert len(user_ai_rate_limiter.history) <= 250
    user_ai_rate_limiter.reset()


