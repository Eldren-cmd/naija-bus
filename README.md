# Naija Transport Route & Fare Finder

This repository is being built strictly from:
- `NaijaTransport_DesignGuide.docx`
- `NaijaTransport_DevPlan.docx`
- `NaijaTransport_EngagementGuide.docx`

## Current Progress
- [x] Phase 1 / Task 1.1: Monorepo skeleton created (`frontend/`, `backend/`, `seed/`, `scripts/`)
- [x] Phase 1 / Task 1.2: Frontend initialized (Vite + React + TypeScript + Tailwind CSS)
- [x] Phase 1 / Task 1.3: Backend initialized (Node + Express + TypeScript + ts-node-dev)
- [x] Phase 1 / Task 1.4: MongoDB Atlas connection tested from backend
- [x] Phase 1 / Task 1.5: Created 6 Mongoose models (Route, Stop, Fare, Report, User, TripRecord)
- [x] Phase 1 / Task 1.6: Created 2dsphere + TTL indexes for route/stop/report collections
- [x] Phase 1 / Task 1.7: Implemented auth routes (`POST /auth/register`, `POST /auth/login`) with bcrypt + JWT
- [x] Phase 1 / Task 1.8: Added JWT auth middleware for protected routes
- [x] Phase 1 / Task 1.9: Added `.env.example` files and documented required env keys
- [x] Phase 1 / Task 1.10: Added route seed dataset and seed script for 5 Lagos corridors
- [x] Phase 1 / Task 1.11: Executed seed script and verified 5 routes in Atlas
- [x] Phase 1 / Task 1.12: Added first unit test suite (fare engine base logic) with Jest
- [x] Social post archive initialized (`social_posts/`)
- [x] Milestone Gate 1 verification complete (`register` returns JWT, `GET /api/v1/routes` returns seeded routes)
- [x] Phase 2 / Task 2.1: `GET /routes` supports `q` text search and `bbox` geo filtering
- [x] Phase 2 / Task 2.2: `GET /routes/:routeId` returns full route document with ordered stops
- [x] Phase 2 / Task 2.3: Admin-protected `POST/PUT/DELETE /routes` endpoints implemented
- [x] Phase 2 / Task 2.4: `GET /stops?near=lng,lat&radius=500` implemented with geospatial query
- [x] Phase 2 / Task 2.5: Fare estimate service layer added (`fareService.ts`) with route lookup + time/traffic multipliers
- [x] Phase 2 / Task 2.6: `GET /fare/estimate` endpoint implemented with route/time query support and fare breakdown response
- [x] Phase 2 / Task 2.7: `GET /search?q=` endpoint implemented to aggregate route + stop matches
- [x] Phase 2 / Task 2.8: Added `express-rate-limit` protection on `/search` and `/routes`
- [x] Phase 2 / Task 2.9: Added `zod` request body validation for backend POST/PUT schemas
- [x] Phase 2 / Task 2.11: Added debounced frontend typeahead `SearchInput` wired to `GET /search`
- [x] Phase 2 / Task 2.15: Wired Home navigation flow to `/route/:routeId` using React Router
- [x] Phase 2 / Frontend MVP View: Route search + RouteView (ordered stops) + FareEstimate panel wired to backend API
- [x] Phase 2 / Integration Tests: Supertest flow added for login, routes list, and fare estimate endpoints
- [x] Phase 2 / Map Rendering: Selected route polyline + stop markers now render in RouteView (Mapbox)
- [x] Milestone Gate 2 / Technical Check: `Ojota` search flow resolves route + map data + fare estimate, backend DB connected, frontend reachable
- [x] Milestone Gate 2 / Visual Check: Browser recording confirms `Ojota` search, route load, map render, stops list, and fare panel
- [x] Phase 3 / Task 3.1: Authenticated `POST /fare/report` endpoint implemented with payload validation and route existence check
- [x] Phase 3 / Task 3.2: Authenticated `POST /reports` endpoint implemented for traffic/police/roadblock style incident reporting
- [x] Phase 3 / Task 3.3: Added `GET /reports?bbox=` endpoint returning active viewport reports
- [x] Phase 3 / Task 3.4: Socket.IO realtime channel initialized on `/reports` with `fare:reported` and `report:created` emits
- [x] Phase 3 / Task 3.5: Added server-side socket filtering with viewport/route subscriptions
- [x] Phase 3 / Task 3.6: Fare estimate logic now blends rule-based fare with recent crowdsourced fare reports
- [x] Phase 3 / Task 3.7: Frontend Report Fare flow added and connected to authenticated `POST /fare/report`
- [x] Phase 3 / Task 3.8: Traffic report modal added with type/severity/description and auto-filled geolocation for authenticated `POST /reports`
- [x] Phase 3 / Task 3.9: Route map now renders severity-coded incident markers from `GET /reports?bbox=`
- [x] Phase 3 / Task 3.10: Frontend Socket.IO client now updates route map report markers live on `report:created` events
- [x] Phase 3 / Task 3.11: Reusable toast notifications now provide report submission success/error feedback
- [x] Phase 3 / Task 3.13: Two-browser realtime marker demo validated (see `docs/phase3-step313-validation.md`)
- [x] Phase 4 / Task 4.1: Backend trip recording endpoint (`POST /trips`) implemented with computed polyline, distance, and duration
- [x] Phase 4 / Task 4.2: Backend trip history endpoint (`GET /trips?userId=`) implemented with auth and role-aware access control
- [x] Phase 4 / Task 4.3: Frontend `TripRecorder` component added with Start/watchPosition checkpoint capture every 5 seconds
- [x] Phase 4 / Task 4.4: Route map now draws live in-progress trip polyline from recorder checkpoints
- [x] Phase 4 / Task 4.5: TripRecorder stop flow now opens preview modal and uploads trip to backend (`POST /trips`)
- [x] Phase 4 / Task 4.6: MyTrips page now fetches and displays trip history cards (date, distance, duration)
- [x] Phase 4 / Task 4.7: MyTrips trip-card click now redraws stored checkpoint polyline on replay map
- [x] Phase 4 / Task 4.8: TripRecorder now handles blocked geolocation permission with explicit UX + retry guidance
- [x] Phase 4 / Task 4.9: Backend now emits realtime `trip:recorded` event after successful trip upload
- [x] Phase 5 / Task 5.1: Login page added; access token now held in memory; backend login sets refresh token in httpOnly cookie
- [x] Phase 5 / Task 5.2: Signup page added with auto-login after successful registration
- [x] Phase 5 / Task 5.3: `POST /auth/refresh` added and frontend now auto-refreshes session on `401` via axios interceptor
- [x] Phase 5 / Task 5.4: Protected route wrapper added; unauthenticated users are redirected to `/login`
- [x] Phase 5 / Task 5.5: Admin-only route management panel added with route table, edit, and delete actions
- [x] Phase 5 / Task 5.6: Admin panel route creation form added and wired to `POST /routes` with full payload validation
- [x] Phase 5 / Task 5.7: Admin panel stop creation form added and wired to protected `POST /stops` endpoint
- [x] Phase 5 / Task 5.8: Saved routes endpoints added and Home now supports saved route list plus save/unsave actions
- [x] Phase 5 / Task 5.9: Mobile responsive audit/fixes completed for Home, RouteView, and MyTrips
- [x] Phase 5 / Task 5.10: Loading skeleton states implemented for core user flows (search/routes/route detail/fare/my-trips)
- [x] Phase 5 / Task 5.11: Saved-routes empty state UX now includes clear guidance and CTA actions
- [x] Phase 5 / Task 5.12: Global error boundary added with recovery actions and incident fallback screen
- [x] Phase 5 / Task 5.13: Playwright E2E coverage added for auth login, saved-route actions, and report submission flow
- [x] Phase 5 / Task 5.14: UAT loop executed with fixes; lazy-loaded heavy map/admin modules and added Vite chunk splitting to reduce initial load pressure
- [x] Phase 6 / Task 6.1: Vercel project linked to repo and frontend env vars configured (`VITE_MAPBOX_KEY`, `VITE_API_BASE`) for production/preview/development
- [x] Phase 6 / Task 6.2: Render backend service provisioned and configured; hosted frontend API base now points to live backend URL
- [x] Phase 6 / Task 6.5: Production CORS allowlist hardening shipped for HTTP + Socket.IO (`CORS_ALLOWED_ORIGINS` with wildcard rejection)
- [x] Phase 6 / Task 6.6: HTTPS redirect/HSTS and secure refresh-cookie hardening shipped for production runtime
- [x] Phase 6 / Task 6.7: CI workflow added for backend test/build and frontend lint/build on push/PR
- [x] Phase 6 / Task 6.8: Frontend CD workflow added for Vercel production deploy on `main`
- [x] Phase 6 / Task 6.9: Backend CD workflow added to trigger Render deploy hook on `main`
- [x] Phase 6 / Task 6.10: Sentry backend observability integrated with token-gated capture validation endpoint
- [x] Phase 6 / Task 6.11: Structured JSON backend logging added with Render sink-ready stdout output
- [x] Phase 6 / Task 6.12: Mapbox billing/quota guardrails added (public-token enforcement, Lagos bounds + zoom caps, billing-alert runbook)
- [x] Phase 6 / Task 6.13: Uptime monitoring added for `/api/v1/health` (GitHub scheduled monitor + UptimeRobot runbook)
- [x] Phase 6 / Task 6.14: Production security audit checks added (dependency audit, repo hygiene checks, runtime smoke checks)
- [x] Phase 6 / Task 6.15: Final production README/demo packaging completed (handoff runbook + demo script + validation pack)
- [x] UX refresh: public homepage (`/`) added with conversion-first hero flow and Route Finder moved to `/map` (with `/search` alias)
- [x] UX fix: removed internal "Phase 2 Core MVP" label from user-facing page copy (now subtle `Beta`)
- [x] UX fix: route list API no longer auto-fires on first page load without explicit user search
- [x] Engagement Gap Remediation: Added bot-auth report ingestion endpoint (`POST /api/v1/reports/bot`) and `whatsapp-web.js` listener flow
- [x] Engagement Gap Remediation: Added Phase 4 gamification baseline (points, streaks, badges, leaderboard surface)
- [x] Design Gap Remediation: MyTrips replay map style aligned with RouteView (`navigation-night-v1`)

## Working Rules for This Build
- Move step-by-step in task order.
- Pause after each completed step and confirm before moving to the next.
- Commit frequently.
- Store a Facebook/LinkedIn/Twitter post after each commit in `social_posts/`.
- Keep secrets out of git.

## Note on GitHub Visibility
The project uses a **private** GitHub repository at `origin` with `main` pushed.

## Environment Setup
1. Copy `.env.example` to `.env.local` at the repo root.
2. Fill `.env.local` with real values for local development only.
3. Never commit real secrets.

### Backend Required Keys
- `PORT`: API port (`5000` for local dev).
- `NODE_ENV`: runtime mode (`development` for local work).
- `LOG_LEVEL`: backend logger level (`info` default).
- `TRUST_PROXY_HOPS`: proxy hop count used for secure request detection behind Render/Cloudflare (`1` default).
- `ENFORCE_HTTPS`: when `true` in production, non-HTTPS requests are redirected to HTTPS (`308`).
- `HSTS_MAX_AGE_SECONDS`: max-age for `Strict-Transport-Security` response header in production.
- `SENTRY_DSN`: Sentry project DSN used for backend error reporting.
- `MONGO_URI`: MongoDB Atlas connection string.
- `JWT_SECRET`: long random secret used to sign/verify access tokens.
- `JWT_EXPIRES_IN`: token duration (for example `7d`).
- `CORS_ALLOWED_ORIGINS`: comma-separated frontend origin allowlist (for example `http://localhost:5173,http://127.0.0.1:5173`).

### Backend Optional Keys
- `SEARCH_RATE_LIMIT_WINDOW_MS`: window size for `/search` rate limit.
- `SEARCH_RATE_LIMIT_MAX`: max requests per window for `/search`.
- `ROUTES_RATE_LIMIT_WINDOW_MS`: window size for `/routes` rate limit.
- `ROUTES_RATE_LIMIT_MAX`: max requests per window for `/routes`.
- `JWT_REFRESH_SECRET`: refresh token signing secret (falls back to `JWT_SECRET` if omitted).
- `JWT_REFRESH_EXPIRES_IN`: refresh token expiry (default `30d`).
- `REFRESH_TOKEN_COOKIE_NAME`: cookie key used for refresh token storage (`naija_refresh_token` default).
- `REFRESH_TOKEN_COOKIE_DOMAIN`: optional refresh-cookie domain override for production.
- `SENTRY_ENVIRONMENT`: sentry environment label (for example `development` or `production`).
- `SENTRY_TRACES_SAMPLE_RATE`: optional tracing sample rate from `0` to `1`.
- `SENTRY_CAPTURE_TEST_TOKEN`: shared token used by `POST /api/v1/observability/sentry-test` for safe capture validation.
- `CORS_ORIGIN`: backward-compatible single-origin key (used when `CORS_ALLOWED_ORIGINS` is not set).
- `BOT_INGEST_TOKEN`: shared token for internal bot ingestion endpoint (`x-bot-token`).
- `BOT_REPORT_USER_ID`: user id attributed to bot-created reports.
- `WHATSAPP_BOT_ENABLED`: enable `whatsapp-web.js` ingestion bot (`true`/`false`).
- `WHATSAPP_ALLOWED_SENDERS`: comma-separated sender MSISDN allowlist for bot commands.
- `WHATSAPP_SESSION_PATH`: local session storage path for WhatsApp auth state.
- `WHATSAPP_PUPPETEER_EXECUTABLE_PATH`: optional local Chrome path when Puppeteer download is skipped.
- `PUPPETEER_CACHE_DIR`: optional cache location for downloaded browser binaries (use app-local path on Render).

### Logging Sink
- Backend logs are emitted as structured JSON to stdout via `pino`.
- On Render, stdout is automatically ingested into the service log stream (sink) for centralized runtime debugging.

### Frontend Keys
- `VITE_API_BASE`: backend base URL used by frontend API calls.
- `VITE_MAPBOX_KEY`: public Mapbox token (`pk...`) used by frontend map surfaces.

### Mapbox Billing Guardrails (Phase 6.12)
1. Use a public browser token only (`pk...`) for `VITE_MAPBOX_KEY`; never use `sk...` in client-accessible env.
2. Restrict token URLs in Mapbox token settings to:
   - `http://localhost:5173/*`
   - `https://naijatransport.vercel.app/*` (or your active production domain)
3. Configure Mapbox billing/usage monitoring from account settings:
   - use token-level statistics/invoice tracking
   - if usage-alert controls are available on your plan, set staged thresholds
   - otherwise rely on external budget alerts plus regular usage review
4. Keep map views constrained to Lagos defaults and zoom bounds (implemented in frontend code) to reduce accidental high tile usage from off-corridor panning.

### Uptime Monitoring (Phase 6.13)
1. Health endpoint: `https://naija-bus-backend.onrender.com/api/v1/health`
2. GitHub Actions scheduled uptime check:
   - workflow: `.github/workflows/uptime-health-check.yml`
   - cadence: every 10 minutes
   - validates response contains:
     - `"status":"ok"`
     - `"database":"connected"`
3. Optional GitHub secret override:
   - `BACKEND_HEALTH_URL` (if backend URL changes)
4. UptimeRobot runbook:
   - create HTTPS monitor for `/api/v1/health`
   - set interval to 10 minutes
   - this keeps free-tier Render service warm and reduces first-request cold starts

### Production Security Audit Checks (Phase 6.14)
1. Security audit workflow:
   - `.github/workflows/security-audit.yml`
2. Automated checks include:
   - dependency audit for backend/frontend production deps (`npm audit --omit=dev --audit-level=critical`)
   - repo hygiene checks to block tracked `.env` and key/certificate artifacts
   - runtime smoke checks against live backend:
     - health endpoint returns `200` + `status=ok` + `database=connected`
     - HSTS header present
     - CORS allowlist allows expected origin and rejects disallowed origin
     - protected endpoints reject unauthenticated requests
3. Optional override secret:
   - `BACKEND_BASE_URL` (if backend host changes)

### Final Production Packaging (Phase 6.15)
1. Final demo/handoff runbook:
   - `docs/final-production-demo-pack.md`
2. Validation evidence:
   - `docs/phase6-step615-validation.md`
3. Live production targets:
   - frontend: `https://naijatransport.vercel.app`
   - backend: `https://naija-bus-backend.onrender.com`
   - backend health: `https://naija-bus-backend.onrender.com/api/v1/health`
4. Final demo script covers:
   - homepage conversion flow
   - route search and route detail load
   - fare estimate update flow
   - report submission and realtime map context
   - trip recording/upload and MyTrips replay
   - auth + saved-route retention behavior

## Seed Data (Phase 1 Task 1.10)
- Dataset file: `seed/initialRoutes.json` (5 Lagos corridors).
- Script file: `scripts/seed.js`.

Commands:
1. Validate only (no DB writes): `node scripts/seed.js --dry-run`
2. Seed database: `node scripts/seed.js`

Latest seed verification:
- Routes in Atlas: `5`
- Stops in Atlas: `25`

## Phase 1 Gate 1 Result
- `POST /auth/register`: `201` with JWT
- `GET /api/v1/routes`: `200` with `5` seeded routes
