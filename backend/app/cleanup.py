"""
Nightly photo retention sweep.

For each Profile with photo_retention_days set, clear photo_url and remove
the on-disk file for any meal older than the cutoff. Doesn't touch the meal
itself — only the photo. Multiple meals can share a photo_url (repeat-meal
clones it), so the file is only unlinked when no other meal references it.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta

from sqlalchemy import select

from app.db import Meal, Profile, SessionLocal
from app.routes.photos import find_photo_path


log = logging.getLogger("nouri.cleanup")


async def run_photo_cleanup() -> int:
    """Returns the number of photo files removed."""
    removed = 0
    now = datetime.utcnow()
    async with SessionLocal() as db:
        profiles = (
            await db.scalars(select(Profile).where(Profile.photo_retention_days.is_not(None)))
        ).all()
        for profile in profiles:
            days = profile.photo_retention_days
            if days is None or days < 1:
                continue
            cutoff = now - timedelta(days=days)
            stale = (
                await db.scalars(
                    select(Meal).where(
                        Meal.device_id == profile.device_id,
                        Meal.photo_url.is_not(None),
                        Meal.logged_at < cutoff,
                    )
                )
            ).all()
            for meal in stale:
                photo_url = meal.photo_url
                meal.photo_url = None
                if not photo_url or not photo_url.startswith("/photos/"):
                    continue
                # Don't unlink if another meal still references the same file.
                other = await db.scalar(
                    select(Meal).where(
                        Meal.photo_url == photo_url,
                        Meal.id != meal.id,
                    ).limit(1)
                )
                if other is not None:
                    continue
                photo_id = photo_url.removeprefix("/photos/")
                path = find_photo_path(photo_id)
                if path is not None:
                    try:
                        path.unlink()
                        removed += 1
                    except Exception as e:
                        log.warning("retention unlink failed for %s: %s", photo_id, e)
        await db.commit()
    if removed:
        log.info("photo retention sweep removed %d files", removed)
    return removed
