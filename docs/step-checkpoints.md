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

### Task 2.7
- Implement `GET /search?q=` aggregating stops + routes matches

Status: complete. Implemented:
- added `GET /api/v1/search` and alias `GET /search`
- `q` query validation (`400` when missing)
- route matching across `name`, `origin`, `destination`, `corridor`, `aliases`
- stop matching by stop name and populated route metadata
- combined response includes `routes`, `stops`, and `counts` summary
- added integration tests in `backend/tests/phase2.integration.test.ts`

### Task 2.8
- Add rate limiting (`express-rate-limit`) on `/search` and `/routes`

Status: complete. Implemented:
- added `express-rate-limit` dependency in backend
- added configurable rate limit middleware in `backend/src/server.ts`
- applied limiter to:
  - `GET /api/v1/search` and `GET /search`
  - `GET /api/v1/routes` and `GET /routes`
- added optional environment keys in `backend/.env.example`:
  - `SEARCH_RATE_LIMIT_WINDOW_MS`
  - `SEARCH_RATE_LIMIT_MAX`
  - `ROUTES_RATE_LIMIT_WINDOW_MS`
  - `ROUTES_RATE_LIMIT_MAX`

### Task 2.9
- Add input validation (`zod`) on all POST/PUT body schemas

Status: complete. Implemented:
- added `zod` dependency in backend
- added centralized validation module:
  - `backend/src/validation/requestSchemas.ts`
- applied zod validation to auth POST schemas:
  - `POST /auth/register`
  - `POST /auth/login`
- applied zod validation to API POST/PUT schemas:
  - `POST /api/v1/routes`
  - `PUT /api/v1/routes/:routeId`
  - `POST /api/v1/fare/report`
  - `POST /api/v1/reports`
- added schema unit tests:
  - `backend/tests/requestSchemas.test.ts`

### Task 2.11
- Build `SearchInput` with debounced typeahead calling `GET /search`

Status: complete. Implemented:
- added `frontend/src/components/SearchInput.tsx`
- debounced query requests (~280ms) to `GET /api/v1/search`
- renders grouped suggestions for route hits and stop hits
- selecting a suggestion updates route query and loads selected route
- integrated component into `frontend/src/App.tsx`
- added frontend API method `searchRoutesAndStops` in `frontend/src/lib/api.ts`
- added shared search response types in `frontend/src/types.ts`
- added search dropdown/focus-ring styles in `frontend/src/App.css`

### Task 2.15
- Wire Home flow: `SearchInput` -> navigate to `/route/:routeId` -> `RouteView`

Status: complete. Implemented:
- added React Router integration:
  - wrapped app with `BrowserRouter` in `frontend/src/main.tsx`
  - configured routes in `frontend/src/App.tsx`:
    - `/`
    - `/route/:routeId`
- wired route selection events to URL navigation (`/route/:routeId`) from:
  - typeahead suggestion clicks
  - route list item clicks
- added route-param synchronization so direct route URLs load and render RouteView flow
- added fallback redirect for unknown frontend paths to `/`

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

### Task 3.2
- Implement `POST /reports` for traffic/police/roadblock submissions

Status: complete. Implemented:
- `POST /api/v1/reports` and alias `POST /reports`
- auth-protected incident reporting with payload validation
- supported report types from model enum (`traffic`, `police`, `roadblock`, `accident`, `hazard`, `other`)
- supported severity (`low`, `medium`, `high`) with default fallback
- required GeoJSON Point coords validation (`[lng, lat]`)
- optional routeId validation + existence check
- added integration tests in `backend/tests/reports.integration.test.ts`
- live checks confirm:
  - no auth -> `401`
  - valid auth + payload -> `201`

### Task 3.3
- Implement `GET /reports?bbox=` returning active reports in viewport

Status: complete. Implemented:
- added `GET /api/v1/reports?bbox=minLng,minLat,maxLng,maxLat` and alias `GET /reports`
- added viewport geospatial filter using GeoJSON polygon + `$geoWithin`
- sorted by newest first and limited response size
- added integration test coverage for:
  - missing bbox -> `400`
  - invalid bbox -> `400`
  - valid bbox -> `200` with filtered reports

### Task 3.4
- Set up Socket.IO server (`/reports`) and emit `report:created` + `fare:reported`

Status: complete. Implemented:
- added realtime module: `backend/src/realtime/reportsSocket.ts`
- initialized Socket.IO server with `/reports` namespace during backend startup
- emit `fare:reported` after successful `POST /fare/report`
- emit `report:created` after successful `POST /reports`
- integration tests now assert emit calls on successful submissions

### Task 3.5
- Implement server-side bbox filtering for socket events (only emit to relevant clients)

Status: complete. Implemented:
- updated realtime namespace handlers in `backend/src/realtime/reportsSocket.ts`
- added per-socket viewport subscriptions via:
  - `viewport:subscribe`
  - `viewport:unsubscribe`
- added route subscriptions for fare events via:
  - `route:subscribe`
  - `route:unsubscribe`
- `report:created` now emits only to sockets whose subscribed bbox contains report coords
- `fare:reported` now targets sockets subscribed to the route when route subscriptions exist
- retained backward-compatible broadcast behavior when no subscriptions are registered
- added socket filtering unit tests in `backend/tests/reportsSocket.filtering.test.ts`

### Task 3.6
- Update fare estimate logic to incorporate recent crowdsourced fare reports

Status: complete. Implemented:
- updated `backend/src/services/fareService.ts` to query recent fare reports (last 2 hours)
- added blended estimate model:
  - rule-based fare from multipliers
  - crowdsourced average fare influence with bounded weight
- added response telemetry fields:
  - `ruleBasedFare`
  - `recentReportsCount`
  - `crowdsourcedAverageFare`
  - `crowdsourcedWeightApplied`
- confidence now increases when recent reports exist (capped)
- added tests in `backend/tests/fareServiceCrowdsource.test.ts`
- live check confirmed blended output after submitting a new fare report

### Task 3.7
- Build Report Fare UI flow on RouteView and connect to `POST /fare/report`

Status: complete. Implemented:
- added `frontend/src/components/ReportFarePanel.tsx`
- added authenticated fare report API client call in `frontend/src/lib/api.ts`
- wired Report Fare panel into main route flow in `frontend/src/App.tsx`
- added fare estimate refresh signal after successful report submit
- added report and success/error styles in `frontend/src/App.css`
- saves JWT token locally in browser storage for repeated report submissions

### Task 3.8
- Build traffic report modal: type, severity, description, auto-fill location

Status: complete. Implemented:
- added `frontend/src/components/TrafficReportModal.tsx`
- added modal workflow for incident reporting with:
  - report `type`
  - report `severity`
  - `description`
  - auto-fill location via browser geolocation
  - manual lng/lat override fields
- wired modal component into main route page (`frontend/src/App.tsx`)
- added frontend API helper `reportIncident` in `frontend/src/lib/api.ts`
- added incident report request/response types in `frontend/src/types.ts`
- added modal + location UI styles in `frontend/src/App.css`

### Next Tasks
- DevPlan alignment backlog from Phase 2: cleared
- 3.9 Add report markers layer to map (severity color coding)
