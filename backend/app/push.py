"""
Web push reminders.

VAPID keys are generated once and persisted to disk inside the photo volume so
they survive deploys. The scheduler runs every 10 minutes; for each subscribed
device whose user has set their reminder time, if (a) we haven't already sent
in the last 23 hours and (b) the user's local clock is within 10 minutes of
their preferred hour, we fire a push.

Copy stays calm per Story Bible §9 — "How's today going?" not "You forgot!"
"""

from __future__ import annotations

import asyncio
import base64
import json
import logging
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec
from pywebpush import WebPushException, webpush
from sqlalchemy import select

from app.config import settings
from app.db import PushSubscription, SessionLocal


log = logging.getLogger("nouri.push")


_keys_cache: dict[str, str] | None = None


def _vapid_path() -> Path:
    base = Path(settings.photo_dir).parent
    base.mkdir(parents=True, exist_ok=True)
    return base / "vapid.json"


def get_vapid_keys() -> dict[str, str]:
    """Return {private_pem, public_b64url}. Generates and persists on first call."""
    global _keys_cache
    if _keys_cache is not None:
        return _keys_cache

    path = _vapid_path()
    if path.exists():
        try:
            data = json.loads(path.read_text())
            if "private_pem" in data and "public_b64url" in data:
                _keys_cache = data
                return data
        except Exception:
            log.warning("vapid.json present but unreadable; regenerating")

    private_key = ec.generate_private_key(ec.SECP256R1(), default_backend())
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode("ascii")

    # Public key in uncompressed point form, then base64url without padding.
    public_numbers = private_key.public_key().public_numbers()
    raw = b"\x04" + public_numbers.x.to_bytes(32, "big") + public_numbers.y.to_bytes(32, "big")
    public_b64url = base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")

    data = {"private_pem": private_pem, "public_b64url": public_b64url}
    tmp = path.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(data))
    os.replace(tmp, path)
    _keys_cache = data
    log.info("generated VAPID keypair at %s", path)
    return data


def public_key_b64url() -> str:
    return get_vapid_keys()["public_b64url"]


async def send_push(sub: PushSubscription, *, title: str, body: str, url: str = "/") -> bool:
    """Fire a single web push. Returns True on success.

    On 404/410 the subscription is dead — caller should delete it.
    """
    keys = get_vapid_keys()
    payload = json.dumps({"title": title, "body": body, "url": url})
    sub_info = {
        "endpoint": sub.endpoint,
        "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
    }
    try:
        await asyncio.to_thread(
            webpush,
            subscription_info=sub_info,
            data=payload,
            vapid_private_key=keys["private_pem"],
            vapid_claims={"sub": settings.vapid_subject},
            ttl=12 * 3600,
        )
        return True
    except WebPushException as e:
        status = getattr(e.response, "status_code", None) if e.response is not None else None
        if status in (404, 410):
            log.info("subscription gone (%s) for device=%s — will purge", status, sub.device_id)
            return False
        log.warning("webpush failed device=%s status=%s err=%s", sub.device_id, status, e)
        return False
    except Exception as e:
        log.exception("webpush unexpected error: %s", e)
        return False


def _user_local_now(sub: PushSubscription, utc_now: datetime) -> datetime:
    return utc_now + timedelta(minutes=sub.tz_offset_min)


async def run_due_reminders(utc_now: datetime | None = None) -> int:
    """Send reminders to anyone whose local clock is close to their chosen hour.

    Tolerates the 10-minute scheduler resolution by firing if local minute is
    within 0–10 of the top of the preferred hour. last_sent_at + 23h prevents
    double-firing.
    """
    if utc_now is None:
        utc_now = datetime.utcnow()
    sent = 0
    async with SessionLocal() as db:
        rows = (
            await db.scalars(select(PushSubscription).where(PushSubscription.enabled == True))  # noqa: E712
        ).all()
        to_delete: list[PushSubscription] = []
        for sub in rows:
            local = _user_local_now(sub, utc_now)
            if local.hour != sub.hour_local:
                continue
            if local.minute >= 10:
                continue
            if sub.last_sent_at and utc_now - sub.last_sent_at < timedelta(hours=23):
                continue
            ok = await send_push(
                sub,
                title="A quiet check-in",
                body="How's today going? Anything to log?",
                url="/",
            )
            if ok:
                sub.last_sent_at = utc_now
                sent += 1
            else:
                to_delete.append(sub)
        for dead in to_delete:
            await db.delete(dead)
        if sent or to_delete:
            await db.commit()
    if sent:
        log.info("reminders sent: %d", sent)
    return sent


async def send_test(device_id) -> bool:
    """Fire an immediate test push for debugging from the settings page."""
    async with SessionLocal() as db:
        sub = await db.get(PushSubscription, device_id)
        if sub is None:
            return False
        return await send_push(sub, title="Test from Nouri", body="Reminders are working.", url="/")
