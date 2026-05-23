from uuid import UUID, uuid4

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import AppEvent, get_session


router = APIRouter()


class EventIn(BaseModel):
    device_id: UUID
    type: str = Field(min_length=1, max_length=64)
    data: dict | None = None


@router.post("", status_code=204)
async def track(body: EventIn, db: AsyncSession = Depends(get_session)) -> None:
    # Fire-and-forget — never make the UI wait on analytics.
    db.add(AppEvent(id=uuid4(), device_id=body.device_id, type=body.type, data=body.data or {}))
    await db.commit()
