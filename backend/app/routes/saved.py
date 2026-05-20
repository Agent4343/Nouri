from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import Meal, SavedMeal, get_session
from app.schemas import (
    LogFromSavedIn,
    MealOut,
    SavedMealIn,
    SavedMealOut,
)

router = APIRouter()


@router.get("", response_model=list[SavedMealOut])
async def list_saved(device_id: UUID, db: AsyncSession = Depends(get_session)) -> list[SavedMealOut]:
    stmt = select(SavedMeal).where(SavedMeal.device_id == device_id).order_by(SavedMeal.created_at.desc())
    rows = (await db.scalars(stmt)).all()
    return [
        SavedMealOut(
            id=s.id,
            name=s.name,
            calories=s.calories,
            protein_g=s.protein_g,
            carbs_g=s.carbs_g,
            fat_g=s.fat_g,
        )
        for s in rows
    ]


@router.post("", response_model=SavedMealOut)
async def create_saved(body: SavedMealIn, db: AsyncSession = Depends(get_session)) -> SavedMealOut:
    saved = SavedMeal(
        id=uuid4(),
        device_id=body.device_id,
        name=body.name,
        calories=body.calories,
        protein_g=body.protein_g,
        carbs_g=body.carbs_g,
        fat_g=body.fat_g,
    )
    db.add(saved)
    await db.commit()
    await db.refresh(saved)
    return SavedMealOut(
        id=saved.id,
        name=saved.name,
        calories=saved.calories,
        protein_g=saved.protein_g,
        carbs_g=saved.carbs_g,
        fat_g=saved.fat_g,
    )


@router.post("/log", response_model=MealOut)
async def log_from_saved(body: LogFromSavedIn, db: AsyncSession = Depends(get_session)) -> MealOut:
    saved = await db.get(SavedMeal, body.saved_meal_id)
    if saved is None or saved.device_id != body.device_id:
        raise HTTPException(404, "saved meal not found")
    # Saved Meals bypass AI entirely (Story Bible §14, §21).
    meal = Meal(
        id=uuid4(),
        device_id=body.device_id,
        label=saved.name,
        calories=saved.calories,
        protein_g=saved.protein_g,
        carbs_g=saved.carbs_g,
        fat_g=saved.fat_g,
        confidence=1.0,
        photo_url=None,
        source="saved",
        corrected=False,
    )
    db.add(meal)
    await db.commit()
    await db.refresh(meal)
    return MealOut(
        id=meal.id,
        device_id=meal.device_id,
        label=meal.label,
        calories=meal.calories,
        protein_g=meal.protein_g,
        carbs_g=meal.carbs_g,
        fat_g=meal.fat_g,
        confidence=meal.confidence,
        photo_url=meal.photo_url,
        source=meal.source,
        corrected=meal.corrected,
        logged_at=meal.logged_at,
        alternatives=[],
    )
