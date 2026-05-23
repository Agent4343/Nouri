from datetime import datetime, timedelta
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import Profile, WeightLog, get_session
from app.schemas import WeightIn, WeightOut


router = APIRouter()


@router.post("", response_model=WeightOut)
async def log_weight(body: WeightIn, db: AsyncSession = Depends(get_session)) -> WeightOut:
    entry = WeightLog(id=uuid4(), device_id=body.device_id, kg=body.kg)
    db.add(entry)

    # Also keep Profile.weight_kg current so the calorie target stays calibrated
    # without forcing the user to update two places.
    profile = await db.get(Profile, body.device_id)
    if profile is not None:
        profile.weight_kg = body.kg

    await db.commit()
    await db.refresh(entry)
    return WeightOut(id=entry.id, kg=entry.kg, logged_at=entry.logged_at)


@router.get("", response_model=list[WeightOut])
async def list_weights(
    device_id: UUID,
    days: int = Query(default=30, ge=1, le=365),
    db: AsyncSession = Depends(get_session),
) -> list[WeightOut]:
    since = datetime.utcnow() - timedelta(days=days)
    stmt = (
        select(WeightLog)
        .where(WeightLog.device_id == device_id, WeightLog.logged_at >= since)
        .order_by(WeightLog.logged_at.asc())
    )
    rows = (await db.scalars(stmt)).all()
    return [WeightOut(id=r.id, kg=r.kg, logged_at=r.logged_at) for r in rows]
