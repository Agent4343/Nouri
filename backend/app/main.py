import asyncio
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import init_db
from app.routes import meals, photos, profile, saved


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
    log.info("startup: photo_dir=%s vision=%s", photo_dir, "claude" if settings.anthropic_api_key else "mock")
    task = asyncio.create_task(_init_db_with_retries())
    try:
        yield
    finally:
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
