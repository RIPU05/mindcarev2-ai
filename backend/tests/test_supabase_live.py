import os
import pytest
from app.auth.client import SupabaseAuthClient
from app.auth.config import SupabaseAuthConfig
from app.exceptions import InvalidTokenException, AuthenticationException
from app.db.uow import UnitOfWork
from app.auth.dependencies import sync_authenticated_user

SUPABASE_TEST_URL = os.getenv("SUPABASE_TEST_URL")
SUPABASE_TEST_ANON_KEY = os.getenv("SUPABASE_TEST_ANON_KEY")
SUPABASE_TEST_EMAIL = os.getenv("SUPABASE_TEST_EMAIL")
SUPABASE_TEST_PASSWORD = os.getenv("SUPABASE_TEST_PASSWORD")

HAS_SUPABASE_TEST_CREDS = bool(
    SUPABASE_TEST_URL
    and SUPABASE_TEST_ANON_KEY
    and SUPABASE_TEST_EMAIL
    and SUPABASE_TEST_PASSWORD
)


@pytest.mark.skipif(
    not HAS_SUPABASE_TEST_CREDS,
    reason="Live Supabase test credentials not supplied in environment (SUPABASE_TEST_URL, SUPABASE_TEST_ANON_KEY, SUPABASE_TEST_EMAIL, SUPABASE_TEST_PASSWORD).",
)
@pytest.mark.anyio
async def test_live_supabase_authentication_flow():
    config = SupabaseAuthConfig(
        url=SUPABASE_TEST_URL,
        anon_key=SUPABASE_TEST_ANON_KEY,
    )
    client = SupabaseAuthClient(config=config)

    # 1. Test live sign in with password
    auth_data = await client.sign_in_with_password(
        email=SUPABASE_TEST_EMAIL,
        password=SUPABASE_TEST_PASSWORD,
    )
    assert "access_token" in auth_data, "Live Supabase auth response must contain access_token"
    access_token = auth_data["access_token"]
    assert isinstance(access_token, str) and len(access_token) > 20

    # 2. Test token verification with backend client
    claims = await client.verify_token(access_token)
    assert claims.get("email") == SUPABASE_TEST_EMAIL
    assert "sub" in claims

    # 3. Test local database user identity synchronization
    async with UnitOfWork() as uow:
        user = await sync_authenticated_user(claims, uow.session)
        assert user is not None
        assert user.email == SUPABASE_TEST_EMAIL

    # 4. Test invalid token rejection
    with pytest.raises(InvalidTokenException):
        await client.verify_token("invalid.jwt.token.payload")

    # 5. Test sign out
    await client.sign_out(access_token)
