import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import init_db
from app.routes import meals, profile, saved


logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
log = logging.getLogger("nouri")


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("startup: configuring database (url scheme=%s)", settings.async_database_url.split("://", 1)[0])
    try:
        await init_db()
        log.info("startup: database ready")
    except Exception:
        # Log and re-raise so the platform sees the failure cause.
        log.exception("startup: init_db failed")
        raise
    yield


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
    return {"ok": True}


app.include_router(profile.router, prefix="/profile", tags=["profile"])
app.include_router(meals.router, prefix="/meals", tags=["meals"])
app.include_router(saved.router, prefix="/saved", tags=["saved"])
