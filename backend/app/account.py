"""
Cross-device data resolution.

Storage stays keyed by device_id everywhere — that's deliberate, it kept
the schema migration trivial when auth was added. But once a user signs
in on multiple devices, reads should aggregate across all of them so the
account is the unit, not the device.

This module owns the question "which device_ids count as 'me' for this
read?" Used by anything that returns historical data (meals, weights,
saved). Writes still target the requesting device — that's fine because
reads will pick up everything anyway.
"""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import DeviceLink


async def resolve_devices(device_id: UUID, db: AsyncSession) -> list[UUID]:
    """Returns every device_id linked to the same user as the input device.

    Falls back to [device_id] when the device isn't linked to any user —
    anonymous devices stay isolated.
    """
    link = await db.get(DeviceLink, device_id)
    if link is None:
        return [device_id]
    rows = (
        await db.scalars(
            select(DeviceLink.device_id).where(DeviceLink.user_id == link.user_id)
        )
    ).all()
    return list(rows) if rows else [device_id]
