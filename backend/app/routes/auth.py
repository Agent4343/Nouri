from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import AuthError, make_token, verify_token
from app.config import settings
from app.db import DeviceLink, User, get_session
from app.email import send_magic_link


router = APIRouter()


class StartIn(BaseModel):
    email: EmailStr


class VerifyIn(BaseModel):
    device_id: UUID
    token: str


class MeOut(BaseModel):
    user_id: UUID | None = None
    email: str | None = None


@router.post("/email/start")
async def start_email_auth(body: StartIn) -> dict[str, bool]:
    """Generate a magic-link token and send it. Always returns the same
    response shape regardless of whether the email exists, so we don't
    leak which addresses have accounts."""
    email = body.email.lower()
    token = make_token(email)
    web = settings.public_web_url.rstrip("/")
    link = f"{web}/auth/verify?token={token}"
    ok, detail = await send_magic_link(email, link)
    if not ok:
        raise HTTPException(503, detail or "couldn't send sign-in email")
    return {"sent": True}


@router.post("/email/verify", response_model=MeOut)
async def verify_email_auth(body: VerifyIn, db: AsyncSession = Depends(get_session)) -> MeOut:
    try:
        email = verify_token(body.token)
    except AuthError as e:
        raise HTTPException(400, str(e))

    # Find-or-create user.
    user = (await db.scalars(select(User).where(User.email == email))).first()
    if user is None:
        user = User(id=uuid4(), email=email)
        db.add(user)
        await db.flush()  # need user.id for the link below

    # Find-or-update device link.
    link = await db.get(DeviceLink, body.device_id)
    if link is None:
        link = DeviceLink(device_id=body.device_id, user_id=user.id)
        db.add(link)
    else:
        link.user_id = user.id

    await db.commit()
    await db.refresh(user)
    return MeOut(user_id=user.id, email=user.email)


@router.get("/me/{device_id}", response_model=MeOut)
async def get_me(device_id: UUID, db: AsyncSession = Depends(get_session)) -> MeOut:
    link = await db.get(DeviceLink, device_id)
    if link is None:
        return MeOut()
    user = await db.get(User, link.user_id)
    if user is None:
        return MeOut()
    return MeOut(user_id=user.id, email=user.email)


@router.post("/sign-out/{device_id}", status_code=204)
async def sign_out(device_id: UUID, db: AsyncSession = Depends(get_session)) -> None:
    link = await db.get(DeviceLink, device_id)
    if link is not None:
        await db.delete(link)
        await db.commit()
