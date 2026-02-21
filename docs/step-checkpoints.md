# Phase 1 Step Checkpoints

## Task 1.1
- Create GitHub repo
- Set up monorepo structure (`frontend/`, `backend/`, `seed/`, `scripts/`)

Status: complete.

## Task 1.2
- Initialize frontend: Vite + React + TypeScript + Tailwind CSS
- Verify frontend runs on localhost:5173

Status: complete. Build successful and dev server port check passed.

## Task 1.3
- Initialize backend: Node + Express + TypeScript
- Add ts-node-dev
- Verify server runs

Status: complete. `npm run build` passes and backend responds on `/api/v1/health` and `/api/v1/routes`.

## Task 1.4
- Create MongoDB Atlas cluster
- Set `MONGO_URI`
- Test connection from backend

Status: complete. Backend health check now reports `"database":"connected"`.

## Task 1.5
- Create all 6 Mongoose models
- `Route`, `Stop`, `Fare`, `Report`, `User`, `TripRecord`

Status: complete. All 6 model files created and backend TypeScript build passes.

## Task 1.6
- Create geospatial indexes:
  - `routes.polyline` (2dsphere)
  - `stops.coords` (2dsphere)
  - `reports.coords` (2dsphere)
- Create TTL index:
  - `reports.createdAt` (7 days)

Status: complete. Indexes are present in Atlas and TTL seconds verified as `604800`.

## Task 1.7
- Implement auth routes with bcrypt + JWT
- `POST /auth/register`
- `POST /auth/login`

Status: complete. Live checks confirm:
- register returns `201` + JWT
- login returns `200` + JWT
- duplicate register returns `409`
- wrong password returns `401`

## Pre-Step 8 Reconciliation (Engagement Guide)
- Added `NaijaTransport_EngagementGuide.docx` as a strict source
- Implemented foundation-level engagement schema extensions in `User` model
- Deferred feature-level engagement work to the planned phases
- Full mapping documented in `docs/engagement-guide-mapping.md`

## Task 1.8
- Add JWT middleware for protected routes
- Validate protected route behavior with and without token

Status: complete. Live checks confirm:
- no token on protected route returns `401`
- valid bearer token returns `200`
- invalid token returns `401`

## Task 1.9
- Create `.env.example` files for backend and frontend
- Document required environment keys in README

Status: complete. Added `backend/.env.example`, `frontend/.env.example`, and README env key documentation.

## Task 1.10
- Add `seed/initialRoutes.json` with 5 Lagos corridors
- Add `scripts/seed.js` to insert/update routes and stops

Status: complete. Seed dataset and script created; `--dry-run` validation passes.

## Task 1.11
- Run `node scripts/seed.js`
- Verify seeded routes in Atlas

Status: complete. Seed execution successful with `5` routes and `25` stops verified.

## Next Tasks
- 1.12 Write first unit test (fare engine) and ensure CI-ready test pass
- Gate 1 verification: register returns JWT, routes endpoint returns seeded routes
