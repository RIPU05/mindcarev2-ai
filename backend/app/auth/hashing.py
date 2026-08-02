import hashlib
import os


def hash_password(password: str) -> str:
    """Hash password securely using built-in scrypt memory-hard function."""
    salt = os.urandom(16)
    # scrypt params: n=16384 (CPU/Memory cost), r=8 (Block size), p=1 (Parallelization)
    key = hashlib.scrypt(password.encode(), salt=salt, n=16384, r=8, p=1)
    return f"scrypt${salt.hex()}${key.hex()}"


def verify_password(password: str, hashed: str) -> bool:
    """Verify password against scrypt hash."""
    if not hashed or not hashed.startswith("scrypt$"):
        return False
    try:
        parts = hashed.split("$")
        if len(parts) != 3:
            return False
        _, salt_hex, key_hex = parts
        salt = bytes.fromhex(salt_hex)
        expected_key = bytes.fromhex(key_hex)
        key = hashlib.scrypt(password.encode(), salt=salt, n=16384, r=8, p=1)
        return key == expected_key
    except Exception:
        return False
