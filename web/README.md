# Nouri Web

Next.js 14 (App Router) + Tailwind. Calm palette per Story Bible §9.

## Pages

- `/onboarding` — First 60 Seconds (§8)
- `/snap` — Log a meal (hint text → mock vision while the real provider is undecided, §31)
- `/correct/[id]` — Quick Correct + low-confidence alternatives (§15, §16)
- `/saved` — Saved meals, "Log again" with one tap (§14)
- `/` — Today: total, forgiving daily message, meal list

## Local

```bash
cd web
npm install
cp .env.example .env.local  # point NEXT_PUBLIC_API_URL at the backend
npm run dev
```

Backend default: `http://localhost:8000`.

## Deploy on Railway

1. Same Railway project as the backend → new service → **Deploy from GitHub repo**, set **Root Directory** to `web`.
2. Set `NEXT_PUBLIC_API_URL` to the backend service's public URL.
3. Add the web service's public URL to the backend's `CORS_ORIGINS`.
4. Railway autodetects the Dockerfile.

## Design rules enforced

- No red, no alarm colors (§9)
- Soft fills, generous spacing
- No streaks, no leaderboards, no badges
- Confidence visible on AI output (§3)
- Anonymous device id — no signup wall in the first 60 seconds (§8)
