"""
Magic-link auth tokens. HMAC-signed, time-limited, single-payload-per-link.

The AUTH_SECRET is auto-generated and persisted to disk on first boot (same
pattern as VAPID keys) so values rotate only when an operator explicitly
deletes the file. Tokens carry the email they're for; verifying the token
means the holder controls that inbox.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import logging
import os
import secrets
import time
from pathlib import Path

from app.config import settings


log = logging.getLogger("nouri.auth")

TOKEN_TTL_SEC = 15 * 60
_secret_cache: str | None = None


class AuthError(Exception):
    pass


def _secret_path() -> Path:
    base = Path(settings.photo_dir).parent
    base.mkdir(parents=True, exist_ok=True)
    return base / "auth_secret.json"


def get_auth_secret() -> str:
    """Return the auth secret, generating + persisting one if needed."""
    global _secret_cache
    if _secret_cache is not None:
        return _secret_cache

    if settings.auth_secret:
        _secret_cache = settings.auth_secret
        return _secret_cache

    path = _secret_path()
    if path.exists():
        try:
            data = json.loads(path.read_text())
            if "secret" in data:
                _secret_cache = data["secret"]
                return _secret_cache
        except Exception:
            log.warning("auth_secret.json unreadable; regenerating")

    secret = secrets.token_urlsafe(48)
    tmp = path.with_suffix(".json.tmp")
    tmp.write_text(json.dumps({"secret": secret}))
    os.replace(tmp, path)
    _secret_cache = secret
    log.info("generated AUTH_SECRET at %s", path)
    return secret


def _sign(payload: str) -> str:
    secret = get_auth_secret()
    return hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()


def make_token(email: str) -> str:
    """Sign a magic-link token for a given email address. Expires in 15 minutes."""
    email_normalized = email.strip().lower()
    exp = int(time.time()) + TOKEN_TTL_SEC
    payload = f"{email_normalized}|{exp}"
    sig = _sign(payload)
    raw = f"{payload}|{sig}".encode()
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def verify_token(token: str) -> str:
    """Return the normalized email if the token is valid, raise AuthError otherwise."""
    if not token or len(token) > 512:
        raise AuthError("token missing or oversized")
    padded = token + "=" * (-len(token) % 4)
    try:
        decoded = base64.urlsafe_b64decode(padded).decode()
    except Exception:
        raise AuthError("token not decodable")
    parts = decoded.split("|")
    if len(parts) != 3:
        raise AuthError("token malformed")
    email, exp_str, sig = parts
    expected = _sign(f"{email}|{exp_str}")
    if not hmac.compare_digest(sig, expected):
        raise AuthError("token signature mismatch")
    try:
        exp = int(exp_str)
    except ValueError:
        raise AuthError("token exp invalid")
    if exp < time.time():
        raise AuthError("token expired")
    return email
