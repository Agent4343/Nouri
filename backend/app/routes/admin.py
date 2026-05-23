"""
Admin stats — the §30 success metrics in one place.

Gated by ADMIN_KEY (set it on the backend service). Computed mostly from
the meals table since it has full history; app_events feeds the funnel
counts. Cheap enough to run on demand for an early beta — revisit with
materialized rollups if the tables get large.
"""

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import distinct, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import AppEvent, Meal, PushSubscription, User, WeightLog, get_session


router = APIRouter()


def _require_key(key: str) -> None:
    if not settings.admin_key or key != settings.admin_key:
        raise HTTPException(403, "forbidden")


@router.get("/stats")
async def stats(
    key: str = Query(...),
    db: AsyncSession = Depends(get_session),
) -> dict:
    _require_key(key)
    now = datetime.utcnow()
    day_ago = now - timedelta(days=1)
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)
    today_start = datetime.combine(now.date(), datetime.min.time())

    async def distinct_devices_since(since: datetime) -> int:
        return int(
            await db.scalar(
                select(func.count(distinct(Meal.device_id))).where(Meal.logged_at >= since)
            )
            or 0
        )

    dau = await distinct_devices_since(day_ago)
    wau = await distinct_devices_since(week_ago)
    mau = await distinct_devices_since(month_ago)

    total_meals = int(await db.scalar(select(func.count(Meal.id))) or 0)
    meals_today = int(
        await db.scalar(select(func.count(Meal.id)).where(Meal.logged_at >= today_start)) or 0
    )
    total_devices = int(await db.scalar(select(func.count(distinct(Meal.device_id)))) or 0)
    total_users = int(await db.scalar(select(func.count(User.id))) or 0)
    reminders_active = int(
        await db.scalar(
            select(func.count(PushSubscription.device_id)).where(PushSubscription.enabled == True)  # noqa: E712
        )
        or 0
    )
    weights_logged = int(await db.scalar(select(func.count(WeightLog.id))) or 0)

    # Source breakdown
    source_rows = (await db.execute(select(Meal.source, func.count()).group_by(Meal.source))).all()
    by_source = {src: int(n) for src, n in source_rows}

    photo_count = by_source.get("photo", 0)
    corrected_photos = int(
        await db.scalar(
            select(func.count(Meal.id)).where(Meal.source == "photo", Meal.corrected == True)  # noqa: E712
        )
        or 0
    )
    avg_photo_conf = await db.scalar(
        select(func.avg(Meal.confidence)).where(Meal.source == "photo")
    )

    # Funnel counts from app_events (recent only — table is new)
    event_rows = (await db.execute(select(AppEvent.type, func.count()).group_by(AppEvent.type))).all()
    events = {t: int(n) for t, n in event_rows}

    return {
        "as_of": now.isoformat() + "Z",
        "active_users": {"dau": dau, "wau": wau, "mau": mau},
        "totals": {
            "signed_in_users": total_users,
            "devices_ever_active": total_devices,
            "meals_all_time": total_meals,
            "meals_today": meals_today,
            "weights_logged": weights_logged,
            "reminders_active": reminders_active,
        },
        "engagement": {
            "meals_per_mau": round(total_meals / mau, 1) if mau else 0.0,
            "quick_correct_rate": round(corrected_photos / photo_count, 3) if photo_count else None,
            "avg_photo_confidence": round(float(avg_photo_conf), 3) if avg_photo_conf is not None else None,
        },
        "meal_sources": by_source,
        "events": events,
    }
