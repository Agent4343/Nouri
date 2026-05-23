import logging
from collections.abc import AsyncIterator
from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import JSON, DateTime, Float, ForeignKey, String, Boolean, text
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from app.config import settings


log = logging.getLogger("nouri.db")


# Engine creation is wrapped so a malformed DATABASE_URL doesn't crash the whole
# module at import time — which would prevent uvicorn from ever binding the port
# and leave the healthcheck timing out with no actionable log line. If creation
# fails, requests that need the DB will fail individually, but /health stays up
# and the cause is logged loudly.
try:
    engine = create_async_engine(settings.async_database_url, echo=False, future=True)
    SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
except Exception as e:
    log.error("failed to create async engine for url=%r: %s", settings.async_database_url, e)
    engine = None  # type: ignore[assignment]
    SessionLocal = None  # type: ignore[assignment]


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
    # Per-device photo retention. null = keep forever (default). Integer = delete
    # photos older than N days during the nightly sweep (Story Bible §25 — give
    # the user an explicit opt-in to short retention).
    photo_retention_days: Mapped[int | None] = mapped_column(nullable=True)
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
    source: Mapped[str] = mapped_column(String(32), default="photo")  # photo|saved|manual|barcode|repeat
    meal_type: Mapped[str | None] = mapped_column(String(20), nullable=True)  # breakfast|lunch|dinner|snack
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


class WeightLog(Base):
    __tablename__ = "weight_logs"

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    device_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), index=True)
    kg: Mapped[float] = mapped_column(Float)
    logged_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow, index=True)


class User(Base):
    """A signed-in identity. One per email. Apple Sign-In links via apple_user_id later."""

    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    apple_user_id: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)


class DeviceLink(Base):
    """Maps an anonymous device_id to a signed-in User. Storage stays keyed by
    device_id everywhere — this table just records who owns which device."""

    __tablename__ = "device_links"

    device_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True)
    user_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), ForeignKey("users.id"), index=True)
    linked_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)


class AppEvent(Base):
    """Lightweight in-DB analytics. Web posts events for key moments
    (snap_logged, sign_in, reminder_subscribed, etc.) so we can compute
    DAU/MAU/retention without bringing in a third-party tracker yet."""

    __tablename__ = "app_events"

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    device_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), index=True)
    type: Mapped[str] = mapped_column(String(64), index=True)
    data: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow, index=True)


class PushSubscription(Base):
    """Browser push subscription endpoint + reminder preferences.

    One device can have one subscription. If a user resubscribes on the same
    device the endpoint is updated rather than duplicated.
    """

    __tablename__ = "push_subscriptions"

    device_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True)
    endpoint: Mapped[str] = mapped_column(String(2048))
    p256dh: Mapped[str] = mapped_column(String(255))
    auth: Mapped[str] = mapped_column(String(255))
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    # Local hour-of-day (0-23) and timezone offset in minutes from UTC.
    # Together they let the server figure out when "now" is the user's preferred reminder time
    # without storing a timezone name.
    hour_local: Mapped[int] = mapped_column(default=20)  # 8pm default
    tz_offset_min: Mapped[int] = mapped_column(default=0)
    last_sent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)


async def init_db() -> None:
    if engine is None:
        raise RuntimeError("engine is not configured (check DATABASE_URL)")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Lightweight self-migration for additive columns. Idempotent —
        # ADD COLUMN IF NOT EXISTS is a no-op when the column already exists.
        # Once schema churn slows we'll move to Alembic.
        for stmt in [
            "ALTER TABLE meals ADD COLUMN IF NOT EXISTS meal_type VARCHAR(20)",
            "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_retention_days INTEGER",
        ]:
            await conn.execute(text(stmt))


async def get_session() -> AsyncIterator[AsyncSession]:
    if SessionLocal is None:
        raise RuntimeError("database not configured")
    async with SessionLocal() as session:
        yield session
