# Nouri API

FastAPI backend for Nouri. Postgres for storage. Mock vision layer for V1 so the
minimum loop (Story Bible §32) can be tested end to end without spending on a
real vision API.

## Endpoints

- `POST /profile` — upsert profile, returns calorie target
- `GET  /profile/{device_id}`
- `POST /meals` — snap log: returns label, calories, confidence, top alternatives
- `PATCH /meals/{meal_id}` — Quick Correct
- `GET  /meals/today?device_id=…` — daily total with forgiving message
- `GET  /saved?device_id=…`
- `POST /saved` — save a meal
- `POST /saved/log` — log a saved meal (bypasses AI, §14/§21)
- `GET  /health`

## Run locally

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # edit DATABASE_URL if needed
uvicorn app.main:app --reload
```

Tables auto-create on startup. Swap in Alembic when the schema starts churning.

## Deploy on Railway

1. New project → Deploy from GitHub repo → set **Root Directory** to `backend`.
2. Add the **PostgreSQL** plugin. Railway sets `DATABASE_URL`; `config.py`
   normalises `postgres://` and `postgresql://` to `postgresql+asyncpg://`.
3. Set `CORS_ORIGINS` to the web app's Railway URL once it's deployed.
4. Healthcheck is `/health`.

## Notes

- `app/vision.py` is a deterministic mock. Swap for a real provider behind the
  same `guess()` interface when Layer 1 (Story Bible §20) is chosen.
- No auth yet. Identity is a client-generated `device_id` (UUID). This is
  intentional for the first 60 seconds (§8) — no signup wall.
