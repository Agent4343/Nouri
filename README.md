# Nouri

Nutrition tracking without perfectionism.

This repo holds three pieces of the V1 minimum loop (Story Bible §32):

- **`backend/`** — FastAPI + Postgres, Railway-ready. Mock vision layer
  swappable for a real provider once one's chosen (§31).
- **`web/`** — Next.js 14 App Router, Railway-ready. The full web app, no
  marketing site yet (deferred).
- **`ios/`** — SwiftUI sources for the iOS app. Drop into a new Xcode
  project on your Mac (see `ios/README.md`).

See `STORY_BIBLE.md` for product vision, tone, and what we don't do.

## The minimum loop, end to end

1. **First 60 Seconds** — `/onboarding` collects optional profile, shows a
   rough target.
2. **Snap** — `/snap` calls `POST /meals`. The mock vision layer returns a
   plausible label + confidence + alternatives.
3. **Quick Correct** — `/correct/[id]` patches the meal. Low-confidence
   results offer one-tap alternatives (§15).
4. **Saved Meals** — `/saved` lists regulars, "Log again" bypasses AI
   entirely (§14, §21).
5. **Today** — `/` shows total, soft progress bar, and a forgiving daily
   message (§6).

## Running locally

```bash
# 1. Postgres (Docker)
docker run -d --name nouri-pg -p 5432:5432 \
  -e POSTGRES_USER=nouri -e POSTGRES_PASSWORD=nouri -e POSTGRES_DB=nouri \
  postgres:16

# 2. Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload   # http://localhost:8000

# 3. Web
cd ../web
npm install
cp .env.example .env.local
npm run dev                     # http://localhost:3000

# 4. iOS
# Open ios/ in Xcode following ios/README.md.
```

## Deploying on Railway

See **`DEPLOY.md`** for the step-by-step walkthrough (project, Postgres,
two services, env vars, smoke test, common failures).

## What's mocked / deferred

- Vision is mocked. Layer 1 vendor undecided (§31). The mock returns
  variable confidence so the low-confidence UX gets exercised.
- No auth. Anonymous `device_id` (UUID) generated client-side and
  persisted. Apple Sign-In comes after the loop is validated with beta
  users.
- No photo upload. The snap flow takes a text hint for now. Add S3/R2 in
  V2 alongside a real vision provider.
- HealthKit, barcode scanning, weight tracking — all V1 features per the
  bible but not in this first scaffold. Add once the minimum loop survives
  contact with real beta users (§32: "Do not overbuild before testing.").
