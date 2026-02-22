# DevPlan Audit (Phase 6)

Audit date: 2026-02-22  
Reference: `NaijaTransport_DevPlan.docx`  
Scope: Task-by-task check from `6.1` to `6.15`.

Status labels:
- `complete`: implemented and verified in code/platform checks
- `partial`: implemented with differences from DevPlan
- `missing`: not implemented yet

Cross-guide enforcement (mandatory):
- `NaijaTransport_DesignGuide.docx` must be checked for user-facing impact on each step.
- `NaijaTransport_EngagementGuide.docx` must be checked for retention/reporting-loop impact on each step.
- A task remains `complete` only when DevPlan acceptance and cross-guide applicability are documented.

| Task | Status | Notes |
| --- | --- | --- |
| 6.1 | complete | Vercel project linked to GitHub repo and frontend env vars added on Vercel (`VITE_MAPBOX_KEY`, `VITE_API_BASE`) for `production`, `preview`, and `development`. `VITE_API_BASE` is temporarily set to `https://replace-with-backend-url.example.com` and will be updated in `6.2` once backend URL is provisioned. |
| 6.2 | complete | Render web service created (`naija-bus-backend`) and linked to private repo with `backend/` root; backend env vars set; Vercel `VITE_API_BASE` updated to Render URL; public health endpoint now returns `{\"status\":\"ok\",\"database\":\"connected\"}`. |
| 6.3 | complete | Production Atlas cluster `naija-transport-prod` is provisioned and backup policy is active (`Daily Snapshot` every `24 Hours`, `Retention Time: 8 Days`, `Snapshot Time: 03:29 GMT+1`). Snapshot pipeline is scheduled and can also be triggered manually via `Take Snapshot Now`. |
| 6.4 | complete | Production seed executed against `MONGO_URI_PROD` with `5` routes and `25` stops; live backend route IDs match seeded production IDs; Vercel frontend deployed on `ultima-pi.vercel.app` with SPA rewrite support and route-refresh verification (`/route/:routeId` returns `200`). |
| 6.5 | complete | Backend now enforces explicit CORS allowlist via `CORS_ALLOWED_ORIGINS` (with legacy fallback `CORS_ORIGIN`), blocks wildcard `*`, and fails fast in production when allowlist is missing. Socket.IO realtime namespace now uses the same allowlist matcher. Render env allowlist set and validated live with allowed and disallowed origins. |
| 6.6 | complete | Backend now applies production HTTPS redirect + HSTS with proxy-aware secure detection and configurable trust-proxy hops. Refresh-token cookies are now production-safe (`Secure`, `HttpOnly`, `SameSite=None`) with optional domain override for custom-domain deployment patterns. |
| 6.7 | complete | Added GitHub Actions CI workflow for `push` + `pull_request` with separate backend and frontend jobs. Backend job runs `npm ci`, `npm run test`, and `npm run build` in `backend/`; frontend job runs `npm ci`, `npm run lint`, and `npm run build` in `frontend/`. |
| 6.8 | complete | Added GitHub Actions CD workflow for frontend production deploy on `main` (`.github/workflows/deploy-frontend.yml`). Workflow runs frontend lint/build, then deploys to Vercel production using `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID`. |
| 6.9 | complete | Added GitHub Actions backend CD workflow for `main` (`.github/workflows/deploy-backend.yml`). Workflow runs backend test/build gates, then triggers Render deploy hook via `RENDER_DEPLOY_HOOK_URL` secret. |
| 6.10 | complete | Sentry backend integration added with DSN-based initialization, process-level exception hooks, and token-gated capture validation endpoint (`POST /api/v1/observability/sentry-test`). 500 responses are now mirrored to Sentry with request metadata. |
| 6.11 | complete | Added structured backend logging via `pino` with request/response lifecycle logs, `>=500` error response logs, and startup/bot-failure logs. Logs emit as JSON to stdout and are sink-ready for Render log ingestion. |
| 6.12 | missing | Pending: Mapbox billing alerts and quota guardrails. |
| 6.13 | missing | Pending: uptime monitoring of `/api/v1/health`. |
| 6.14 | missing | Pending: production security audit checks. |
| 6.15 | missing | Pending: final production README/demo packaging. |

## Task 6.5 Completion Note

Status: complete.

Implemented:
- backend CORS hardening in `backend/src/server.ts`:
  - added explicit allowlist parser for `CORS_ALLOWED_ORIGINS`
  - retained backward-compatible fallback `CORS_ORIGIN`
  - production startup guard when no allowlist is configured
  - wildcard `*` rejection
  - normalized-origin matching for browser requests
- realtime CORS hardening in `backend/src/realtime/reportsSocket.ts`:
  - Socket.IO namespace now uses allowlist matcher aligned with HTTP CORS rules
  - credentials flag preserved
- env documentation updates:
  - `backend/.env.example`
  - `README.md`

Validation:
- local quality gates:
  - `npm --prefix backend run test` passed
  - `npm --prefix backend run build` passed
- live preflight checks against Render backend:
  - allowed origin returns `access-control-allow-origin` for allowlisted domains
  - disallowed origin no longer receives permissive wildcard/static origin behavior
- evidence document:
  - `docs/phase6-step65-validation.md`

Cross-guide compliance:
- Design Guide: no direct visual changes; production hardening improves reliability of user-facing flows.
- Engagement Guide: stricter cross-origin controls protect report/trip/auth data paths, improving trust for repeat engagement loops.

## Task 6.6 Completion Note

Status: complete.

Implemented:
- production transport hardening in `backend/src/server.ts`:
  - added configurable proxy trust setting via `TRUST_PROXY_HOPS`
  - added forwarded-proto aware secure-request detection for reverse-proxy hosting
  - enforced HTTPS redirect (`308`) in production when `ENFORCE_HTTPS` is enabled
  - added production `Strict-Transport-Security` header with configurable `HSTS_MAX_AGE_SECONDS`
- refresh-cookie hardening in `backend/src/routes/auth.ts`:
  - production refresh cookie now uses `Secure` + `HttpOnly` + `SameSite=None`
  - optional `REFRESH_TOKEN_COOKIE_DOMAIN` override supported for custom domains
  - non-production behavior remains `SameSite=Lax`
- env/documentation updates:
  - `backend/.env.example`
  - `README.md`

Validation:
- local quality gates:
  - `npm --prefix backend run test` passed
  - `npm --prefix backend run build` passed
- evidence document:
  - `docs/phase6-step66-validation.md`

Cross-guide compliance:
- Design Guide: no direct visual redesign; transport/cookie hardening reduces auth/session failure risk in production UI flows.
- Engagement Guide: stronger HTTPS + cookie policy improves trust and continuity for repeat login/report/trip engagement loops.

## Task 6.7 Completion Note

Status: complete.

Implemented:
- added CI workflow:
  - `.github/workflows/ci.yml`
- workflow triggers:
  - `push`
  - `pull_request`
- workflow jobs:
  - `Backend Test and Build`
    - `npm ci`
    - `npm run test`
    - `npm run build`
  - `Frontend Lint and Build`
    - `npm ci`
    - `npm run lint`
    - `npm run build`
- workflow runtime:
  - `actions/checkout@v4`
  - `actions/setup-node@v4` on Node `20`
  - npm caching enabled per package lockfile

Validation:
- local quality gates:
  - `npm --prefix backend run test` passed
  - `npm --prefix backend run build` passed
  - `npm --prefix frontend run lint` passed
  - `npm --prefix frontend run build` passed
- evidence document:
  - `docs/phase6-step67-validation.md`

Cross-guide compliance:
- Design Guide: no direct visual redesign in CI setup; quality gates reduce risk of regressions in shipped UI experiences.
- Engagement Guide: CI guardrails reduce release risk for engagement loops (auth, reports, trips, saved routes) by blocking broken builds before merge/deploy.

## Task 6.8 Completion Note

Status: complete.

Implemented:
- added frontend CD workflow:
  - `.github/workflows/deploy-frontend.yml`
- workflow trigger scope:
  - `push` on `main`
  - path-filtered to frontend deployment surface:
    - `frontend/**`
    - `vercel.json`
    - workflow file
- workflow behavior:
  - installs frontend dependencies
  - runs frontend lint and build gates
  - installs Vercel CLI
  - pulls Vercel project settings (`vercel pull`)
  - deploys to production (`vercel deploy --prod`)
- required GitHub Actions secrets:
  - `VERCEL_TOKEN`
  - `VERCEL_ORG_ID`
  - `VERCEL_PROJECT_ID`

Validation:
- local quality gates:
  - `npm --prefix frontend run lint` passed
  - `npm --prefix frontend run build` passed
  - `npm --prefix backend run test` passed
  - `npm --prefix backend run build` passed
- evidence document:
  - `docs/phase6-step68-validation.md`

Cross-guide compliance:
- Design Guide: no direct visual redesign; release automation helps preserve production design consistency by reducing manual deploy drift.
- Engagement Guide: production deploy automation improves iteration speed and reliability for engagement loops shipped in previous phases.

## Task 6.9 Completion Note

Status: complete.

Implemented:
- added backend CD workflow:
  - `.github/workflows/deploy-backend.yml`
- workflow trigger scope:
  - `push` on `main`
  - path-filtered to backend deploy surface:
    - `backend/**`
    - workflow file
- workflow behavior:
  - installs backend dependencies
  - runs backend `test` and `build` gates
  - triggers Render deploy hook using `RENDER_DEPLOY_HOOK_URL`
- required GitHub Actions secret:
  - `RENDER_DEPLOY_HOOK_URL`

Validation:
- local quality gates:
  - `npm --prefix backend run test` passed
  - `npm --prefix backend run build` passed
  - `npm --prefix frontend run lint` passed
  - `npm --prefix frontend run build` passed
- evidence document:
  - `docs/phase6-step69-validation.md`

Cross-guide compliance:
- Design Guide: no direct visual redesign; backend deploy automation reduces production drift and keeps UI-backed APIs in sync with reviewed behavior.
- Engagement Guide: faster, safer backend releases improve reliability of auth/report/trip/saved-route engagement loops.

## Task 6.10 Completion Note

Status: complete.

Implemented:
- added backend observability module:
  - `backend/src/config/observability.ts`
  - DSN-based Sentry initialization (`SENTRY_DSN`)
  - environment support (`SENTRY_ENVIRONMENT`)
  - optional tracing sample-rate parsing (`SENTRY_TRACES_SAMPLE_RATE`)
  - shared capture + flush helpers
- integrated Sentry into backend runtime:
  - `backend/src/server.ts`
  - startup observability initialization via `initObservability()`
  - process-level hooks for `unhandledRejection` and `uncaughtExceptionMonitor`
  - automatic capture mirror for JSON responses with status `>=500`
- added safe capture validation endpoint:
  - `POST /api/v1/observability/sentry-test`
  - alias: `POST /observability/sentry-test`
  - protected by `x-sentry-test-token` against `SENTRY_CAPTURE_TEST_TOKEN`
  - captures test exception and flushes Sentry client before returning `202`
- configuration/documentation updates:
  - `backend/.env.example`
  - `README.md`

Validation:
- local quality gates:
  - `npm --prefix backend run test` passed
  - `npm --prefix backend run build` passed
  - `npm --prefix frontend run lint` passed
  - `npm --prefix frontend run build` passed
- evidence document:
  - `docs/phase6-step610-validation.md`

Cross-guide compliance:
- Design Guide: no direct visual redesign; improved backend observability reduces blind failures that would degrade user-facing UI trust.
- Engagement Guide: faster incident detection improves stability of repeated engagement loops (auth, reporting, trip logging, saved routes).

## Task 6.11 Completion Note

Status: complete.

Implemented:
- added structured logging module:
  - `backend/src/config/logger.ts`
  - `pino` logger with:
    - service/environment metadata
    - configurable `LOG_LEVEL`
    - token/header redaction for sensitive fields
- integrated request lifecycle logging:
  - `backend/src/server.ts`
  - per-request JSON log entry with method/path/status/duration/ip/userAgent
- integrated structured backend error logging:
  - automatic log capture for JSON responses with status `>=500`
  - startup and bot startup failures logged with structured error payloads
  - auth-route failures logged in `backend/src/routes/auth.ts`
- sink integration baseline:
  - logs stream to stdout in JSON format
  - Render service log stream ingests stdout as centralized sink
- configuration/documentation updates:
  - `backend/.env.example` (`LOG_LEVEL`)
  - `README.md`

Validation:
- local quality gates:
  - `npm --prefix backend run test` passed
  - `npm --prefix backend run build` passed
  - `npm --prefix frontend run lint` passed
  - `npm --prefix frontend run build` passed
- evidence document:
  - `docs/phase6-step611-validation.md`

Cross-guide compliance:
- Design Guide: no direct visual redesign; structured logging reduces time-to-diagnose backend/API issues that impact UI reliability.
- Engagement Guide: improved backend diagnostics reduces disruption risk for recurring commuter engagement loops.

## Recovery Order (Strict DevPlan Alignment)

1. Continue with `6.12` next.
2. Keep phase-6 tasks in strict sequence with step-level validation and compliance notes.
