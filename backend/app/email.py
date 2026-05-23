"""
Magic-link email delivery.

Three-tier strategy: Resend if RESEND_API_KEY is set, otherwise log the link
to stdout (dev mode). SMTP can be added later if anyone asks; Resend's free
tier (3K emails/mo) is more than enough for an early beta.
"""

from __future__ import annotations

import logging

import httpx

from app.config import settings


log = logging.getLogger("nouri.email")


async def send_magic_link(email: str, link: str) -> tuple[bool, str | None]:
    """Send a sign-in link. Returns (ok, error_detail).

    Falls back to logging the link if no provider is configured — useful in
    dev, surprising in prod, so we log loudly.
    """
    if settings.resend_api_key:
        return await _send_via_resend(email, link)

    log.warning(
        "EMAIL NOT CONFIGURED — magic link for %s would be: %s "
        "(set RESEND_API_KEY for real delivery)",
        email,
        link,
    )
    return True, None


async def _send_via_resend(email: str, link: str) -> tuple[bool, str | None]:
    body = {
        "from": settings.email_from,
        "to": [email],
        "subject": "Sign in to Nouri",
        "html": (
            "<p>Tap to sign in:</p>"
            f'<p><a href="{link}">Sign in to Nouri</a></p>'
            "<p style=\"color:#888;font-size:12px\">"
            "This link expires in 15 minutes. If you didn't ask for it, "
            "you can safely ignore this email."
            "</p>"
        ),
        "text": (
            f"Sign in to Nouri: {link}\n\n"
            "This link expires in 15 minutes. If you didn't ask for it, "
            "you can safely ignore this email."
        ),
    }
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            r = await client.post(
                "https://api.resend.com/emails",
                json=body,
                headers={"Authorization": f"Bearer {settings.resend_api_key}"},
            )
        if r.status_code >= 400:
            snippet = r.text[:300]
            log.warning("Resend rejected (%s): %s", r.status_code, snippet)
            return False, f"resend {r.status_code}: {snippet}"
        return True, None
    except Exception as e:
        log.warning("Resend transport error: %s", e)
        return False, f"transport error: {e}"
