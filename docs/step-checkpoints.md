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

## Task 1.12
- Add first unit test for fare engine base logic
- Run Jest test suite and ensure passing

Status: complete. Jest suite added (`tests/fareEngine.test.ts`) and passes (`5/5` tests).

## Milestone Gate 1
- `POST /auth/register` -> `201` with JWT: PASS
- `GET /api/v1/routes` -> `200` with seeded routes: PASS (`5` routes)

Status: Gate 1 passed. Phase 1 foundation is complete.

## Phase 2 - Core MVP

### Task 2.1
- Implement `GET /routes` with `q` text search and `bbox` geo filter support

Status: complete. Live checks confirm:
- `GET /api/v1/routes` -> `200` with all seeded routes
- `GET /api/v1/routes?q=Ojota` -> filtered match
- `GET /api/v1/routes?bbox=...` -> geo-filtered match
- invalid `bbox` -> `400`

### Task 2.2
- Implement `GET /routes/:routeId`
- Return full route document + ordered stops

Status: complete. Live checks confirm:
- valid routeId -> `200` with route payload and stops
- invalid routeId -> `400`
- unknown routeId -> `404`

### Task 2.3
- Implement admin-protected `POST /routes`, `PUT /routes/:routeId`, `DELETE /routes/:routeId`
- Protect with JWT middleware + admin role guard

Status: complete. Live checks confirm:
- no auth create -> `401`
- non-admin create -> `403`
- admin create -> `201`
- admin update -> `200`
- admin delete -> `200`
- get deleted route -> `404`

### Task 2.4
- Implement `GET /stops?near=lng,lat&radius=500`

Status: complete. Live checks confirm:
- valid near/radius -> `200` with nearby stops
- missing `near` -> `400`
- invalid `near` -> `400`
- invalid `radius` -> `400`

### Task 2.5
- Implement fare engine service for estimate endpoint
- Base formula: `baseFare x trafficMultiplier x timeMultiplier`

Status: complete. Implemented:
- `backend/src/services/fareService.ts`
- route-aware fare estimate service with validation
- time-band resolver (`off_peak`, `normal`, `rush_hour`)
- traffic-level resolver (`low`, `medium`, `high`)
- service-level helper tests in `backend/tests/fareService.test.ts`

### Task 2.6
- Implement `GET /fare/estimate?routeId=&time=` calling fare engine service

Status: complete. Implemented:
- `GET /api/v1/fare/estimate` and alias `GET /fare/estimate`
- query validation (`routeId` required)
- response includes fare breakdown + confidence + computed timestamp
- service error mapping:
  - invalid input -> `400`
  - unknown route -> `404`

### Phase 2 Frontend MVP View
- Build RouteView page section showing selected route + ordered stops
- Build FareEstimate component calling `GET /fare/estimate`

Status: complete. Implemented:
- Route search + selectable route list in `frontend/src/App.tsx`
- RouteView component in `frontend/src/components/RouteView.tsx`
- FareEstimate component in `frontend/src/components/FareEstimate.tsx`
- Shared API client in `frontend/src/lib/api.ts`
- Verified frontend production build passes

### Phase 2 Integration Tests (Supertest)
- Write integration tests (Supertest): login, GET routes, GET fare/estimate

Status: complete. Implemented:
- Added `backend/tests/phase2.integration.test.ts`
- Added test environment setup `backend/tests/setupEnv.ts`
- Added Supertest dependencies in backend devDependencies
- Verified:
  - `POST /api/v1/auth/login` -> `200` with JWT
  - `GET /api/v1/routes` -> `200` with route payload
  - `GET /api/v1/fare/estimate` -> `200` with fare breakdown
  - unknown route on fare estimate -> `404`

### Map Rendering Task
- Draw selected route polyline in RouteView
- Show stop markers on the rendered map

Status: complete. Implemented:
- Added `frontend/src/components/RouteMap.tsx`
- Integrated Mapbox map with route polyline + stop marker layers
- Wired RouteView to render map component
- Added fallback message when `VITE_MAPBOX_KEY` is missing
- Verified frontend build and lint pass

### Milestone Gate 2 (Technical Flow Check)
- Verify flow: search `Ojota`, open route, load route detail + fare panel data

Status: complete (technical checks). Verified:
- `GET /api/v1/health` -> `ok`, DB `connected`
- `GET /api/v1/routes?q=Ojota` -> returned route match
- `GET /api/v1/routes/:routeId` -> returned stops and polyline payload
- `GET /api/v1/fare/estimate?routeId=&time=08:30` -> returned fare breakdown
- frontend dev server reachable on `http://localhost:5173` (`200`)

### Milestone Gate 2 (Visual Confirmation)
- Record browser flow: search `Ojota`, select route, show map + stops + fare panel

Status: complete. Verified from captured recording:
- `Ojota -> CMS` search and selection shown
- route map polyline + stop markers visible
- stops list visible
- fare estimate panel with breakdown and confidence visible

## Phase 3 - Crowdsourced Intelligence

### Task 3.1
- Implement `POST /fare/report` (auth required); store fare report in DB

Status: complete. Implemented:
- `POST /api/v1/fare/report` and alias `POST /fare/report`
- auth-protected report submission with validation
- route existence check before save
- mapped payload `reportedFare` -> `Fare.amount`
- added integration tests in `backend/tests/fareReport.integration.test.ts`

### Next Tasks
- 3.2 Implement `POST /reports` for traffic/police/roadblock submissions
