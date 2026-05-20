from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import Profile, get_session
from app.schemas import ProfileIn, ProfileOut

router = APIRouter()


def _mifflin_st_jeor(age: int, weight_kg: float, height_cm: float) -> int:
    # Sex-neutral midpoint. Story Bible §8: "Here's a rough number. We'll adjust as we learn."
    return int(10 * weight_kg + 6.25 * height_cm - 5 * age + 0)


def _calorie_target(p: ProfileIn) -> int | None:
    if p.age is None or p.weight_kg is None or p.height_cm is None:
        return None
    bmr = _mifflin_st_jeor(p.age, p.weight_kg, p.height_cm)
    tdee = int(bmr * 1.4)  # light activity default
    if p.goal == "lose":
        return max(1200, tdee - 400)
    if p.goal == "gain":
        return tdee + 300
    return tdee


@router.post("", response_model=ProfileOut)
async def upsert_profile(body: ProfileIn, db: AsyncSession = Depends(get_session)) -> ProfileOut:
    target = _calorie_target(body)
    existing = await db.get(Profile, body.device_id)
    if existing is None:
        profile = Profile(
            device_id=body.device_id,
            age=body.age,
            weight_kg=body.weight_kg,
            height_cm=body.height_cm,
            goal=body.goal,
            calorie_target=target,
        )
        db.add(profile)
    else:
        existing.age = body.age
        existing.weight_kg = body.weight_kg
        existing.height_cm = body.height_cm
        existing.goal = body.goal
        existing.calorie_target = target
        profile = existing
    await db.commit()
    await db.refresh(profile)
    return ProfileOut(
        device_id=profile.device_id,
        age=profile.age,
        weight_kg=profile.weight_kg,
        height_cm=profile.height_cm,
        goal=profile.goal,
        calorie_target=profile.calorie_target,
    )


@router.get("/{device_id}", response_model=ProfileOut)
async def get_profile(device_id: UUID, db: AsyncSession = Depends(get_session)) -> ProfileOut:
    profile = await db.get(Profile, device_id)
    if profile is None:
        raise HTTPException(404, "profile not found")
    return ProfileOut(
        device_id=profile.device_id,
        age=profile.age,
        weight_kg=profile.weight_kg,
        height_cm=profile.height_cm,
        goal=profile.goal,
        calorie_target=profile.calorie_target,
    )
