# Deploying Nouri on Railway

One Railway project, three services: Postgres, backend, web.

## 1. Create the project

1. https://railway.app → **New Project** → **Empty Project**.
2. Name it `nouri`.

## 2. Add Postgres

1. **+ New** → **Database** → **Add PostgreSQL**.
2. Railway creates a service called `Postgres`. It exposes `DATABASE_URL`
   to other services in the project automatically via Railway's variable
   references.

## 3. Backend service

1. **+ New** → **GitHub Repo** → select `agent4343/nouri`.
2. **Settings → Source**:
   - **Root Directory:** `backend`
   - **Branch:** `claude/nouri-story-bible-qHhSB` (or `main` once merged)
3. **Settings → Build:** confirm it picked up the Dockerfile (it should
   say "Dockerfile" with path `Dockerfile`).
4. **Variables** — add one variable using Railway's reference syntax so it
   tracks the Postgres service:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
   - `CORS_ORIGINS` = `*` (we'll lock this down in step 5)
5. **Settings → Networking → Generate Domain** to get a public URL like
   `nouri-backend-production.up.railway.app`.
6. Deploy. Tail the logs; you should see Uvicorn start and tables create
   on first boot. Hit `https://<that-url>/health` — expect `{"ok": true}`.

The backend's `config.py` normalises `postgres://` and `postgresql://` to
`postgresql+asyncpg://`, so the raw Railway `DATABASE_URL` works as-is.

## 4. Web service

1. **+ New** → **GitHub Repo** → same repo.
2. **Settings → Source**:
   - **Root Directory:** `web`
   - **Branch:** same as backend.
3. **Variables:**
   - `BACKEND_URL` = the backend's public URL from step 3.5
     (e.g. `https://nouri-backend-production.up.railway.app`) — **no
     trailing slash**.
   - This is a runtime env var, not a build-time one. Next.js proxies
     `/api/*` to it server-side via `next.config.js`, so the browser only
     ever talks to the web service. No CORS dance, no NEXT_PUBLIC_*
     baked into the JS bundle, rotate freely without rebuilding.
4. **Settings → Networking → Generate Domain**.
5. Deploy. Open the URL → should redirect to `/onboarding` on first load.

## 5. CORS (not needed)

The browser only talks to the web service (which proxies to the backend
server-side), so cross-origin requests never happen and `CORS_ORIGINS` on
the backend can stay at the default `*` or be omitted entirely.

## 6. Smoke test

From the web app:

1. Click through `/onboarding` (try the "Skip" button to verify the
   no-signup path).
2. `/snap` → enter a hint → "Log it" → lands on `/correct/[id]`.
3. Use Quick Correct to change calories → return to `/` → verify the
   daily total updates and the forgiving message renders.
4. `/saved` → add a saved meal → "Log again" → confirm a fresh meal
   appears on today's list with `source: "saved"`.

## 7. iOS against the deployed backend

In your local Xcode project, either:

- Add `NouriApiUrl` (String) to `Info.plist` with the backend's public
  URL, **or**
- In **Product → Scheme → Edit Scheme → Run → Arguments → Environment
  Variables**, set `NOURI_API_URL` to the same URL.

Both are read by `APIClient.swift`; the env var wins.

## Cost notes

- Railway free trial gives you ~$5 of usage. Postgres + two small
  services idles around \$5–10/mo for a beta of this size.
- The mock vision layer makes zero outbound API calls. Real cost shows up
  the moment we wire the real provider (Story Bible §21 covers the
  controls we'll add then).

## Common failures

| Symptom | Likely cause |
| --- | --- |
| Backend logs `connection refused` to Postgres | `DATABASE_URL` isn't using the `${{Postgres.DATABASE_URL}}` reference. |
| Web loads but every call 404s | `BACKEND_URL` not set on the web service, or has a trailing slash / whitespace. |
| `/api/*` requests time out | `BACKEND_URL` points at the wrong host (often a Railway-internal hostname that the runtime container can't resolve — use the public `*.up.railway.app` URL). |
| Healthcheck fails on first deploy | First boot creates tables; if Postgres isn't reachable the boot hangs. Check `DATABASE_URL`. |
