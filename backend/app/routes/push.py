from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import PushSubscription, get_session
from app.push import public_key_b64url, send_test


router = APIRouter()


class SubscriptionKeys(BaseModel):
    p256dh: str
    auth: str


class SubscribeIn(BaseModel):
    device_id: UUID
    endpoint: str = Field(min_length=10, max_length=2048)
    keys: SubscriptionKeys
    hour_local: int = Field(default=20, ge=0, le=23)
    tz_offset_min: int = Field(default=0, ge=-840, le=840)  # ±14h


class SettingsIn(BaseModel):
    device_id: UUID
    enabled: bool
    hour_local: int = Field(ge=0, le=23)
    tz_offset_min: int = Field(ge=-840, le=840)


class SubscriptionOut(BaseModel):
    enabled: bool
    hour_local: int
    tz_offset_min: int


@router.get("/public-key")
async def get_public_key() -> dict[str, str]:
    return {"public_key": public_key_b64url()}


@router.post("/subscribe", response_model=SubscriptionOut)
async def subscribe(body: SubscribeIn, db: AsyncSession = Depends(get_session)) -> SubscriptionOut:
    existing = await db.get(PushSubscription, body.device_id)
    if existing is None:
        existing = PushSubscription(
            device_id=body.device_id,
            endpoint=body.endpoint,
            p256dh=body.keys.p256dh,
            auth=body.keys.auth,
            enabled=True,
            hour_local=body.hour_local,
            tz_offset_min=body.tz_offset_min,
        )
        db.add(existing)
    else:
        existing.endpoint = body.endpoint
        existing.p256dh = body.keys.p256dh
        existing.auth = body.keys.auth
        existing.enabled = True
        existing.hour_local = body.hour_local
        existing.tz_offset_min = body.tz_offset_min
    await db.commit()
    await db.refresh(existing)
    return SubscriptionOut(
        enabled=existing.enabled, hour_local=existing.hour_local, tz_offset_min=existing.tz_offset_min
    )


@router.post("/settings", response_model=SubscriptionOut)
async def update_settings(body: SettingsIn, db: AsyncSession = Depends(get_session)) -> SubscriptionOut:
    sub = await db.get(PushSubscription, body.device_id)
    if sub is None:
        raise HTTPException(404, "no subscription yet")
    sub.enabled = body.enabled
    sub.hour_local = body.hour_local
    sub.tz_offset_min = body.tz_offset_min
    await db.commit()
    return SubscriptionOut(enabled=sub.enabled, hour_local=sub.hour_local, tz_offset_min=sub.tz_offset_min)


@router.get("/settings/{device_id}", response_model=SubscriptionOut | None)
async def get_settings(device_id: UUID, db: AsyncSession = Depends(get_session)) -> SubscriptionOut | None:
    sub = await db.get(PushSubscription, device_id)
    if sub is None:
        return None
    return SubscriptionOut(enabled=sub.enabled, hour_local=sub.hour_local, tz_offset_min=sub.tz_offset_min)


@router.delete("/subscribe/{device_id}", status_code=204)
async def unsubscribe(device_id: UUID, db: AsyncSession = Depends(get_session)) -> None:
    sub = await db.get(PushSubscription, device_id)
    if sub is not None:
        await db.delete(sub)
        await db.commit()


@router.post("/test/{device_id}")
async def test(device_id: UUID) -> dict[str, bool]:
    ok = await send_test(device_id)
    return {"ok": ok}
