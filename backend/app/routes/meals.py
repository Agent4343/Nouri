import logging
from datetime import date, datetime, time, timedelta
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.copy import daily_message
from app.db import Meal, Profile, get_session
from app.routes.photos import find_photo_path, media_type_for
from app.schemas import (
    ManualMealIn,
    MealAlternative,
    MealCorrection,
    MealIn,
    MealOut,
    RepeatMealIn,
    TodaySummary,
    WeeklyDayTotal,
    YesterdayMeal,
)
from app.vision import VisionGuess, guess as mock_guess
from app.vision_claude import analyze_food, is_configured as claude_configured


log = logging.getLogger("nouri.meals")
router = APIRouter()


async def _vision_for(
    photo_id: str | None, hint: str | None, meal_type: str | None
) -> tuple[VisionGuess, str | None]:
    """Run vision for the given inputs. Returns (guess, photo_url_or_None).

    Real Claude vision when a photo is uploaded AND the API key is set.
    Falls back to mock on any failure or when prerequisites aren't met —
    Story Bible §6: failures stay calm; the loop never breaks because
    the vision provider is down.
    """
    combined_hint = " · ".join(p for p in (meal_type, hint) if p) or None

    if photo_id and claude_configured():
        path = find_photo_path(photo_id)
        if path is None:
            raise HTTPException(404, "photo not found")
        try:
            image_bytes = path.read_bytes()
            mg = await analyze_food(image_bytes, media_type_for(path), hint=hint, meal_type=meal_type)
            real = VisionGuess(
                label=mg.label,
                calories=mg.calories,
                protein_g=mg.protein_g,
                carbs_g=mg.carbs_g,
                fat_g=mg.fat_g,
                confidence=mg.confidence,
                alternatives=[(a.label, a.calories) for a in mg.alternatives],
            )
            return real, f"/photos/{photo_id}"
        except HTTPException:
            raise
        except Exception as e:
            log.warning("vision call failed, falling back to mock: %s", e)
            return mock_guess(seed=photo_id, hint=combined_hint), f"/photos/{photo_id}"

    # No photo, no API key, or API key set but no photo → mock
    photo_url = f"/photos/{photo_id}" if photo_id and find_photo_path(photo_id) else None
    return mock_guess(seed=photo_id, hint=combined_hint), photo_url


def _to_out(meal: Meal, alternatives: list[MealAlternative] | None = None) -> MealOut:
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
        alternatives=alternatives or [],
    )


@router.post("", response_model=MealOut)
async def log_meal(body: MealIn, db: AsyncSession = Depends(get_session)) -> MealOut:
    g, photo_url = await _vision_for(body.photo_id, body.hint, body.meal_type)
    when = _resolve_logged_at(body.logged_at)
    meal = Meal(
        id=uuid4(),
        device_id=body.device_id,
        label=g.label,
        calories=g.calories,
        protein_g=g.protein_g,
        carbs_g=g.carbs_g,
        fat_g=g.fat_g,
        confidence=g.confidence,
        photo_url=photo_url,
        source="photo" if photo_url else "manual",
        logged_at=when,
    )
    db.add(meal)
    await db.commit()
    await db.refresh(meal)
    alternatives = [MealAlternative(label=lbl, calories=cal) for lbl, cal in g.alternatives]
    return _to_out(meal, alternatives)


def _resolve_logged_at(provided: datetime | None) -> datetime:
    """Clamp backfill timestamps to the last 14 days and never let them be future-dated."""
    if provided is None:
        return datetime.utcnow()
    now = datetime.utcnow()
    # Strip timezone for comparison — DB stores naive UTC.
    naive = provided.replace(tzinfo=None) if provided.tzinfo else provided
    if naive > now:
        return now
    earliest = now - timedelta(days=14)
    if naive < earliest:
        return earliest
    return naive


@router.patch("/{meal_id}", response_model=MealOut)
async def quick_correct(
    meal_id: UUID,
    body: MealCorrection,
    db: AsyncSession = Depends(get_session),
) -> MealOut:
    meal = await db.get(Meal, meal_id)
    if meal is None:
        raise HTTPException(404, "meal not found")
    if body.label is not None:
        meal.label = body.label
    if body.calories is not None:
        meal.calories = body.calories
    if body.protein_g is not None:
        meal.protein_g = body.protein_g
    if body.carbs_g is not None:
        meal.carbs_g = body.carbs_g
    if body.fat_g is not None:
        meal.fat_g = body.fat_g
    meal.corrected = True
    meal.confidence = 1.0  # user has spoken
    await db.commit()
    await db.refresh(meal)
    return _to_out(meal)


@router.delete("/{meal_id}", status_code=204)
async def delete_meal(meal_id: UUID, db: AsyncSession = Depends(get_session)) -> None:
    meal = await db.get(Meal, meal_id)
    if meal is None:
        raise HTTPException(404, "meal not found")
    await db.delete(meal)
    await db.commit()


@router.get("/today", response_model=TodaySummary)
async def today(device_id: UUID, db: AsyncSession = Depends(get_session)) -> TodaySummary:
    today_date = datetime.utcnow().date()
    today_start = datetime.combine(today_date, time.min)
    today_end = today_start + timedelta(days=1)

    # Today's meals (newest first for the list)
    stmt = (
        select(Meal)
        .where(Meal.device_id == device_id, Meal.logged_at >= today_start, Meal.logged_at < today_end)
        .order_by(Meal.logged_at.desc())
    )
    rows = (await db.scalars(stmt)).all()

    profile = await db.get(Profile, device_id)
    target = profile.calorie_target if profile else None
    total_cal = sum(m.calories for m in rows)
    total_p = sum(m.protein_g for m in rows)
    total_c = sum(m.carbs_g for m in rows)
    total_f = sum(m.fat_g for m in rows)

    # 7-day calorie totals (oldest first) — for the home-page chart.
    week_start = today_start - timedelta(days=6)
    week_stmt = (
        select(
            func.date_trunc("day", Meal.logged_at).label("day"),
            func.coalesce(func.sum(Meal.calories), 0).label("cals"),
        )
        .where(Meal.device_id == device_id, Meal.logged_at >= week_start, Meal.logged_at < today_end)
        .group_by("day")
    )
    rows_by_day: dict[date, int] = {}
    for day, cals in (await db.execute(week_stmt)).all():
        if isinstance(day, datetime):
            day = day.date()
        rows_by_day[day] = int(cals)
    week: list[WeeklyDayTotal] = []
    for offset in range(6, -1, -1):
        d = today_date - timedelta(days=offset)
        week.append(WeeklyDayTotal(date=d.isoformat(), calories=rows_by_day.get(d, 0)))

    # Yesterday's meals, deduped by label (most recent meal wins) — fuel for
    # the "Repeat yesterday" surface (§14).
    yesterday_start = today_start - timedelta(days=1)
    yesterday_stmt = (
        select(Meal)
        .where(
            Meal.device_id == device_id,
            Meal.logged_at >= yesterday_start,
            Meal.logged_at < today_start,
        )
        .order_by(Meal.logged_at.desc())
    )
    yesterday_rows = (await db.scalars(yesterday_stmt)).all()
    seen_labels: set[str] = set()
    yesterday: list[YesterdayMeal] = []
    for m in yesterday_rows:
        key = m.label.strip().lower()
        if key in seen_labels:
            continue
        seen_labels.add(key)
        yesterday.append(YesterdayMeal(source_meal_id=m.id, label=m.label, calories=m.calories))
        if len(yesterday) >= 6:
            break

    # How long since the most recent log? 0 if anything today, else N days back.
    last_stmt = (
        select(Meal.logged_at)
        .where(Meal.device_id == device_id)
        .order_by(Meal.logged_at.desc())
        .limit(1)
    )
    last_log = (await db.scalars(last_stmt)).first()
    if last_log is None:
        days_since = 0
    else:
        days_since = max(0, (today_date - last_log.date()).days)

    return TodaySummary(
        device_id=device_id,
        total_calories=total_cal,
        total_protein_g=round(total_p, 1),
        total_carbs_g=round(total_c, 1),
        total_fat_g=round(total_f, 1),
        target_calories=target,
        meals=[_to_out(m) for m in rows],
        message=daily_message(total_cal, target, days_since),
        week=week,
        days_since_last_log=days_since,
        yesterday=yesterday,
    )


@router.post("/manual", response_model=MealOut)
async def log_manual(body: ManualMealIn, db: AsyncSession = Depends(get_session)) -> MealOut:
    """Log a meal from barcode lookup or manual entry — bypasses vision."""
    source = body.source if body.source in {"manual", "barcode"} else "manual"
    meal = Meal(
        id=uuid4(),
        device_id=body.device_id,
        label=body.label,
        calories=body.calories,
        protein_g=body.protein_g,
        carbs_g=body.carbs_g,
        fat_g=body.fat_g,
        confidence=1.0,
        photo_url=None,
        source=source,
        corrected=False,
        logged_at=_resolve_logged_at(body.logged_at),
    )
    db.add(meal)
    await db.commit()
    await db.refresh(meal)
    return _to_out(meal)


@router.post("/repeat", response_model=MealOut)
async def repeat_meal(body: RepeatMealIn, db: AsyncSession = Depends(get_session)) -> MealOut:
    """Relog a prior meal as-is. Bypasses AI (§21) — user has already confirmed it before."""
    source = await db.get(Meal, body.source_meal_id)
    if source is None or source.device_id != body.device_id:
        raise HTTPException(404, "source meal not found")
    clone = Meal(
        id=uuid4(),
        device_id=body.device_id,
        label=source.label,
        calories=source.calories,
        protein_g=source.protein_g,
        carbs_g=source.carbs_g,
        fat_g=source.fat_g,
        confidence=1.0,
        photo_url=source.photo_url,
        source="repeat",
        corrected=False,
    )
    db.add(clone)
    await db.commit()
    await db.refresh(clone)
    return _to_out(clone)
