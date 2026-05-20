from collections.abc import AsyncIterator
from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Float, ForeignKey, String, Boolean
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

from app.config import settings


engine = create_async_engine(settings.async_database_url, echo=False, future=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


class Base(DeclarativeBase):
    pass


def _utcnow() -> datetime:
    return datetime.utcnow()


class Profile(Base):
    __tablename__ = "profiles"

    device_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True)
    age: Mapped[int | None] = mapped_column(nullable=True)
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    height_cm: Mapped[float | None] = mapped_column(Float, nullable=True)
    goal: Mapped[str | None] = mapped_column(String(32), nullable=True)
    calorie_target: Mapped[int | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)


class Meal(Base):
    __tablename__ = "meals"

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    device_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), index=True)
    label: Mapped[str] = mapped_column(String(120))
    calories: Mapped[int] = mapped_column()
    protein_g: Mapped[float] = mapped_column(Float, default=0)
    carbs_g: Mapped[float] = mapped_column(Float, default=0)
    fat_g: Mapped[float] = mapped_column(Float, default=0)
    confidence: Mapped[float] = mapped_column(Float)
    photo_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    source: Mapped[str] = mapped_column(String(32), default="photo")  # photo|saved|manual
    corrected: Mapped[bool] = mapped_column(Boolean, default=False)
    logged_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow, index=True)


class SavedMeal(Base):
    __tablename__ = "saved_meals"

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    device_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), index=True)
    name: Mapped[str] = mapped_column(String(120))
    calories: Mapped[int] = mapped_column()
    protein_g: Mapped[float] = mapped_column(Float, default=0)
    carbs_g: Mapped[float] = mapped_column(Float, default=0)
    fat_g: Mapped[float] = mapped_column(Float, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_session() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        yield session
