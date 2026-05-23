import asyncio
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import init_db


# Sentry initializes at import time so it catches startup errors too. If
# SENTRY_DSN isn't set, this silently no-ops.
def _init_sentry() -> bool:
    if not settings.sentry_dsn:
        return False
    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration

        sentry_sdk.init(
            dsn=settings.sentry_dsn,
            environment=settings.sentry_environment,
            integrations=[FastApiIntegration()],
            traces_sample_rate=0.1,
            send_default_pii=False,
        )
        return True
    except Exception:
        # Don't let Sentry init failure block app boot.
        return False


_sentry_on = _init_sentry()
from app.auth import get_auth_secret
from app.cleanup import run_photo_cleanup
from app.push import get_vapid_keys, run_due_reminders
from app.routes import admin, auth, barcode, events, meals, photos, profile, push, saved, weights

from apscheduler.schedulers.asyncio import AsyncIOScheduler


logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
log = logging.getLogger("nouri")


_db_ready = False


async def _init_db_with_retries() -> None:
    """Background init so a missing/unreachable Postgres doesn't block the port bind.

    Uvicorn runs lifespan.startup before accepting connections — so if we await
    init_db here and Postgres is unreachable, the healthcheck never has a port
    to hit. Run it in the background instead, with bounded retries and loud
    logging so Deploy logs reveal what went wrong.
    """
    global _db_ready
    delays = [1, 2, 4, 8, 16, 30]
    for attempt, delay in enumerate(delays, start=1):
        try:
            await init_db()
            _db_ready = True
            log.info("startup: database ready (attempt %d)", attempt)
            return
        except Exception as e:
            log.warning("startup: init_db attempt %d failed: %s", attempt, e)
            await asyncio.sleep(delay)
    log.error("startup: init_db gave up after %d attempts; tables not created", len(delays))


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheme = settings.async_database_url.split("://", 1)[0]
    host_part = settings.async_database_url.split("@", 1)[-1] if "@" in settings.async_database_url else "<no-host>"
    log.info("startup: db scheme=%s host=%s", scheme, host_part)
    photo_dir = Path(settings.photo_dir)
    photo_dir.mkdir(parents=True, exist_ok=True)
    log.info(
        "startup: photo_dir=%s vision=%s key_len=%d",
        photo_dir,
        "claude" if settings.anthropic_api_key else "mock",
        len(settings.anthropic_api_key),
    )

    # Ensure VAPID keys exist so the public-key endpoint can answer immediately.
    try:
        keys = get_vapid_keys()
        log.info("startup: push enabled (public key suffix=…%s)", keys["public_b64url"][-8:])
    except Exception as e:
        log.warning("startup: VAPID key init failed: %s", e)

    # Warm the auth secret so the first sign-in request doesn't take the
    # disk-write hit. Same persistence pattern as VAPID.
    try:
        get_auth_secret()
        log.info(
            "startup: auth ready (email=%s public_web=%s)",
            "resend" if settings.resend_api_key else "console-only",
            settings.public_web_url,
        )
    except Exception as e:
        log.warning("startup: auth secret init failed: %s", e)

    task = asyncio.create_task(_init_db_with_retries())

    # In-process scheduler — for a single web replica this is enough. Move to
    # an external worker when scaling beyond one replica.
    scheduler = AsyncIOScheduler()
    scheduler.add_job(run_due_reminders, "interval", minutes=10, id="reminders", coalesce=True, max_instances=1)
    scheduler.add_job(run_photo_cleanup, "interval", hours=24, id="photo_cleanup", coalesce=True, max_instances=1)
    scheduler.start()
    log.info("startup: schedulers running (reminders 10m, photo cleanup 24h)")
    log.info("startup: sentry=%s", "on" if _sentry_on else "off")

    try:
        yield
    finally:
        scheduler.shutdown(wait=False)
        task.cancel()


app = FastAPI(title="Nouri API", version="0.1.0", lifespan=lifespan)

origins = [o.strip() for o in settings.cors_origins.split(",")] if settings.cors_origins != "*" else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, bool]:
    # Liveness only — does not depend on the database. Use /ready for the latter.
    return {"ok": True}


@app.get("/ready")
async def ready() -> dict[str, bool]:
    return {"ok": True, "db": _db_ready}


app.include_router(profile.router, prefix="/profile", tags=["profile"])
app.include_router(meals.router, prefix="/meals", tags=["meals"])
app.include_router(saved.router, prefix="/saved", tags=["saved"])
app.include_router(photos.router, prefix="/photos", tags=["photos"])
app.include_router(weights.router, prefix="/weights", tags=["weights"])
app.include_router(barcode.router, prefix="/barcode", tags=["barcode"])
app.include_router(push.router, prefix="/push", tags=["push"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(events.router, prefix="/events", tags=["events"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])
