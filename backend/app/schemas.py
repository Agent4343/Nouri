from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ProfileIn(BaseModel):
    device_id: UUID
    age: int | None = Field(default=None, ge=10, le=120)
    weight_kg: float | None = Field(default=None, gt=0, lt=500)
    height_cm: float | None = Field(default=None, gt=0, lt=300)
    goal: str | None = Field(default=None, max_length=32)


class ProfileOut(BaseModel):
    device_id: UUID
    age: int | None
    weight_kg: float | None
    height_cm: float | None
    goal: str | None
    calorie_target: int | None


class MealAlternative(BaseModel):
    label: str
    calories: int


class MealIn(BaseModel):
    device_id: UUID
    photo_url: str | None = None
    hint: str | None = None  # optional text hint from user


class MealOut(BaseModel):
    id: UUID
    device_id: UUID
    label: str
    calories: int
    protein_g: float
    carbs_g: float
    fat_g: float
    confidence: float
    photo_url: str | None
    source: str
    corrected: bool
    logged_at: datetime
    alternatives: list[MealAlternative] = []


class MealCorrection(BaseModel):
    label: str | None = None
    calories: int | None = Field(default=None, ge=0, le=5000)
    protein_g: float | None = Field(default=None, ge=0)
    carbs_g: float | None = Field(default=None, ge=0)
    fat_g: float | None = Field(default=None, ge=0)


class TodaySummary(BaseModel):
    device_id: UUID
    total_calories: int
    total_protein_g: float
    total_carbs_g: float
    total_fat_g: float
    target_calories: int | None
    meals: list[MealOut]
    message: str  # forgiving daily-total framing


class SavedMealIn(BaseModel):
    device_id: UUID
    name: str
    calories: int = Field(ge=0, le=5000)
    protein_g: float = 0
    carbs_g: float = 0
    fat_g: float = 0


class SavedMealOut(BaseModel):
    id: UUID
    name: str
    calories: int
    protein_g: float
    carbs_g: float
    fat_g: float


class LogFromSavedIn(BaseModel):
    device_id: UUID
    saved_meal_id: UUID
