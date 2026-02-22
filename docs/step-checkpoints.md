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

## Cross-Phase Compliance Tracking
- Full retrospective (previous phases) and forward (future phases) Design+Engagement compliance audit is maintained in:
  - `docs/cross-phase-compliance-audit.md`

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

### Task 3.9
- Add report markers layer to map (severity color coding)

Status: complete. Implemented:
- extended frontend API client with `GET /api/v1/reports?bbox=` helper
- added report bbox typing in `frontend/src/types.ts`
- updated `frontend/src/components/RouteMap.tsx` to:
  - fetch active reports for route viewport bbox
  - render report markers as a dedicated map layer
  - color-code markers by severity (`high`/`medium`/`low`)
  - scale marker radius by severity
  - show marker popup summary on click
- added map legend + live report count/error UX in `frontend/src/App.css`

### Task 3.10
- Add frontend Socket.IO client for real-time report marker updates

Status: complete. Implemented:
- added frontend `socket.io-client` dependency
- updated `frontend/src/components/RouteMap.tsx` to:
  - open Socket.IO connection to `/reports` namespace
  - subscribe/unsubscribe to current route viewport bbox (`viewport:subscribe`)
  - subscribe/unsubscribe current route channel (`route:subscribe`)
  - handle `report:created` events and upsert markers without page reload
- show realtime connection state under map
- kept initial `GET /reports?bbox=` fetch as baseline data load before live stream updates

### Task 3.11
- Add toast feedback component for report submissions

Status: complete. Implemented:
- added reusable `ToastStack` component (`frontend/src/components/ToastStack.tsx`)
- added app-level toast state management in `frontend/src/App.tsx`:
  - timed auto-dismiss
  - manual dismiss action
- wired report submission feedback to toast notifications:
  - `frontend/src/components/ReportFarePanel.tsx`
  - `frontend/src/components/TrafficReportModal.tsx`
- replaced prior inline submission success/error messaging with toasts
- added toast UI styles + mobile behavior in `frontend/src/App.css`

### Task 3.13
- Validate two-browser realtime marker demo flow

Status: complete. Implemented:
- added automated validation script:
  - `frontend/scripts/phase3-step313-realtime-check.mjs`
- script validates realtime `report:created` behavior by running:
  - two subscribed socket clients inside route viewport bbox
  - one subscribed socket client outside viewport bbox
- script submits a live incident report and asserts:
  - in-viewport clients receive event
  - out-of-viewport client does not receive event
- validation record stored in:
  - `docs/phase3-step313-validation.md`
- latest execution result: `pass: true`

## Phase 4 - Trip Recording

### Task 4.1
- Implement `POST /trips` (auth required); compute simplified polyline + distance from checkpoints

Status: complete. Implemented:
- added trip create request validation (`validateTripCreateBody`) in:
  - `backend/src/validation/requestSchemas.ts`
- added backend trip recording endpoint:
  - `POST /api/v1/trips`
  - `POST /trips`
- route-level checks:
  - auth required (`401` when missing)
  - payload validation (`400` on invalid trip payload)
  - optional `routeId` existence check (`404` when provided route is missing)
- computation implemented in `backend/src/server.ts`:
  - haversine distance accumulation from ordered checkpoints
  - simplified polyline generation for stored trip path
  - duration calculation from checkpoint/start/end timestamps
- trip persisted via `TripRecord` model with:
  - `checkpoints`
  - computed `polyline`
  - `distanceMeters`
  - `durationSeconds`
  - `startedAt` / `endedAt`
- added integration tests:
  - `backend/tests/trips.integration.test.ts`
- expanded schema tests:
  - `backend/tests/requestSchemas.test.ts`
- validation checks passed:
  - `npm --prefix backend run test`
  - `npm --prefix backend run build`

### Task 4.2
- Implement `GET /trips?userId=` returning user's trip history

Status: complete. Implemented:
- added backend trip history endpoint:
  - `GET /api/v1/trips?userId=...`
  - `GET /trips?userId=...`
- auth and access control in `backend/src/server.ts`:
  - auth required (`401` when missing)
  - `userId` query required and validated (`400` when missing/invalid)
  - non-admin users can only request their own `userId` (`403` otherwise)
  - admin users can request other users' histories
- query behavior:
  - fetches trips by `userId`
  - sorts by newest `startedAt` first
  - limits to 200 records
  - populates route metadata (`name`, `origin`, `destination`, `transportType`)
- test coverage added in `backend/tests/trips.integration.test.ts`:
  - missing/invalid `userId`
  - forbidden cross-user access
  - success for same-user request
  - success for admin cross-user request
- validation checks passed:
  - `npm --prefix backend run test`
  - `npm --prefix backend run build`

### Task 4.3
- Build `TripRecorder` component: Start button -> watchPosition every 5s -> local state array

Status: complete. Implemented:
- added `frontend/src/components/TripRecorder.tsx`
- component behavior:
  - `Start Recording` initializes browser geolocation `watchPosition`
  - captures checkpoints at a 5-second cadence into local state array
  - stores each checkpoint as GeoJSON point + timestamp + optional accuracy
  - exposes recording state, checkpoint count, and latest checkpoint summary
  - supports `Stop` to halt watch stream
- wired TripRecorder into main route flow in `frontend/src/App.tsx`
- added trip recorder styles in `frontend/src/App.css`
- added shared frontend checkpoint type in `frontend/src/types.ts`
- validation checks passed:
  - `npm --prefix frontend run lint`
  - `npm --prefix frontend run build`

### Task 4.4
- Show live polyline on map as checkpoints are collected (in-progress trip)

Status: complete. Implemented:
- lifted live trip checkpoints to route-level state in `frontend/src/App.tsx`
- passed checkpoint stream through:
  - `App` -> `RouteView` -> `RouteMap`
- extended `frontend/src/components/RouteMap.tsx` with live trip map layers:
  - added `trip-live-source` GeoJSON source
  - added `trip-live-layer` line layer for in-progress trip path
  - updates polyline in real time as new checkpoints arrive
  - clears line automatically when a new recording starts (checkpoint reset)
- added map legend + status text for live trip path
- added map legend swatch styling in `frontend/src/App.css`
- validation checks passed:
  - `npm --prefix frontend run lint`
  - `npm --prefix frontend run build`

### Task 4.5
- Stop button -> preview modal showing trip path + distance -> Upload button -> `POST /trips`

Status: complete. Implemented:
- enhanced `frontend/src/components/TripRecorder.tsx` flow:
  - `Stop & Preview` opens modal when at least 2 checkpoints exist
  - preview modal shows:
    - trip path preview (SVG polyline)
    - checkpoint count
    - computed distance
    - computed duration
  - upload action calls `POST /api/v1/trips`
- added frontend trip API wiring:
  - `createTripRecord` in `frontend/src/lib/api.ts`
  - `TripRecordInput`/`TripRecordResponse` types in `frontend/src/types.ts`
- added JWT token field in preview modal (stored in localStorage key already used by auth flows)
- wired `TripRecorder` with app toast notifications in `frontend/src/App.tsx`
- added preview modal/path styles in `frontend/src/App.css`
- validation checks passed:
  - `npm --prefix frontend run lint`
  - `npm --prefix frontend run build`

### Task 4.6
- Build MyTrips page: fetch `GET /trips`, display trip cards with date + distance + duration

Status: complete. Implemented:
- added new frontend route:
  - `/my-trips` in `frontend/src/App.tsx`
- built MyTrips page UI and data flow:
  - token input + load action
  - profile resolution via `GET /api/v1/auth/me`
  - trip history fetch via `GET /api/v1/trips?userId=...`
  - rendered trip cards with:
    - date/time
    - distance
    - duration
    - route summary metadata
- added frontend API helpers in `frontend/src/lib/api.ts`:
  - `getAuthProfile`
  - `getTripsByUser`
- added shared types in `frontend/src/types.ts`:
  - `AuthProfileResponse`
  - `TripRecordResponse` (with populated route shape support)
- added navigation links for Route Finder and MyTrips in `frontend/src/App.tsx`
- added MyTrips layout/card styles in `frontend/src/App.css`
- validation checks passed:
  - `npm --prefix frontend run lint`
  - `npm --prefix frontend run build`

### Task 4.7
- On MyTrips card click: show trip polyline on map using stored checkpoints GeoJSON

Status: complete. Implemented:
- added `frontend/src/components/MyTripMap.tsx`
- map behavior:
  - builds trip line GeoJSON from stored `trip.checkpoints[].coords.coordinates`
  - renders selected trip polyline in a dedicated MyTrips map panel
  - fits map bounds to selected trip path
  - clears line state when no replayable trip is selected
- updated `frontend/src/App.tsx` MyTrips flow:
  - added selectable trip-card behavior
  - preserves selected card when possible after reload
  - defaults to first trip on successful load
  - wired selected trip into `MyTripMap`
- updated MyTrips UI styles in `frontend/src/App.css`:
  - active trip card state
  - map panel layout and canvas styling
- validation checks passed:
  - `npm --prefix frontend run lint`
  - `npm --prefix frontend run build`

### Task 4.8
- Handle geolocation-denied UX path for trip recorder

Status: complete. Implemented:
- updated `frontend/src/components/TripRecorder.tsx`:
  - added explicit geolocation permission state tracking (`granted`/`prompt`/`blocked`/fallback)
  - added permission-aware start guard:
    - if browser permission is already blocked, recorder does not start and shows actionable error
  - added geolocation error mapping:
    - permission denied
    - timeout
    - generic unavailable fallback
  - prevented false "need 2 checkpoints" error when recorder stops due to permission failure
  - added blocked-permission warning panel with retry button (`Retry Location Access`)
- updated trip recorder styling in `frontend/src/App.css` for permission warning UI
- validation checks passed:
  - `npm --prefix frontend run lint`
  - `npm --prefix frontend run build`

### Task 4.9
- Emit `trip:recorded` realtime event after successful trip upload

Status: complete. Implemented:
- updated realtime socket module `backend/src/realtime/reportsSocket.ts`:
  - added `emitTripRecorded` emitter
  - event name: `trip:recorded`
  - emits to route-subscribed sockets when `routeId` is present
  - falls back to namespace broadcast when no route subscriptions exist
- updated trip create flow in `backend/src/server.ts`:
  - after `TripRecord.create`, backend now emits `trip:recorded` payload with:
    - trip id
    - user id
    - route id (when available)
    - distance, duration, checkpoints count
    - start/end/create timestamps
- updated backend integration tests:
  - `backend/tests/trips.integration.test.ts` now asserts `emitTripRecorded` call on successful `POST /api/v1/trips`
  - updated other socket-module mocks in:
    - `backend/tests/fareReport.integration.test.ts`
    - `backend/tests/reports.integration.test.ts`
- validation checks passed:
  - `npm --prefix backend run test`
  - `npm --prefix backend run build`
  - `npm --prefix frontend run lint`
  - `npm --prefix frontend run build`

### Milestone Gate 4
- Record a real walk/drive with GPS, stop recording, upload trip, verify on MyTrips and map replay.

Status: pending user-run manual validation.
Notes:
- Engineering implementation for `4.1` through `4.9` is complete.
- Manual gate verification requires real-device/location interaction.

### Next Tasks
- Continue to Phase 5 in strict order starting with `5.1`.

## Phase 5 - Auth, Admin & UX Polish

### Mandatory Cross-Guide Check (Design + Engagement)
- After each Phase 5 task completion, run and record:
  - DevPlan acceptance check
  - Design Guide applicability check (`NaijaTransport_DesignGuide.docx`)
  - Engagement Guide applicability check (`NaijaTransport_EngagementGuide.docx`)
- If an applicable guide requirement is missing, do not mark the task fully complete until it is implemented or explicitly documented as out-of-scope for that task.

### Task 5.1
- Build Login page (`POST /auth/login`); store access token in memory; refresh token in httpOnly cookie

Status: complete. Implemented:
- backend auth updates:
  - `POST /api/v1/auth/login` now sets refresh token cookie (`httpOnly`) and returns access token payload
  - added refresh token helpers in `backend/src/lib/auth.ts` (`signRefreshToken`, `verifyRefreshToken`) for upcoming `5.3`
  - enabled credentialed CORS in `backend/src/server.ts` (`credentials: true`)
  - added refresh token env placeholders in `backend/.env.example`:
    - `JWT_REFRESH_SECRET`
    - `JWT_REFRESH_EXPIRES_IN`
    - `REFRESH_TOKEN_COOKIE_NAME`
- frontend auth/session updates:
  - added auth context/provider:
    - `frontend/src/auth/AuthContext.ts`
    - `frontend/src/auth/AuthProvider.tsx`
  - access token is now held in memory (React state), not localStorage
  - added login API helper with `credentials: "include"`:
    - `loginUser` in `frontend/src/lib/api.ts`
  - added login page UI:
    - `frontend/src/components/LoginPage.tsx`
    - route `/login` in `frontend/src/App.tsx`
  - app nav now shows login/logout session state and signed-in identity
  - refactored token-gated actions to consume in-memory auth token via props/context:
    - `TripRecorder`
    - `ReportFarePanel`
    - `TrafficReportModal`
    - `MyTripsPage`
  - removed frontend localStorage JWT persistence flow (`naija_transport_jwt`)
- validation checks passed:
  - `npm --prefix backend run test`
  - `npm --prefix backend run build`
  - `npm --prefix frontend run lint`
  - `npm --prefix frontend run build`

### Next Tasks
- Continue Phase 5 in strict order: `5.2` (Signup page + auto-login after registration).

### Task 5.2
- Build Signup page (`POST /auth/register`); auto-login after registration

Status: complete. Implemented:
- frontend signup flow:
  - added `frontend/src/components/SignupPage.tsx`
  - added route `/signup` in `frontend/src/App.tsx`
  - wired signup submit to backend `POST /api/v1/auth/register`
  - on successful registration, session auto-login is applied via auth context and user is redirected to `/`
- auth navigation updates:
  - signed-out nav now exposes both `Login` and `Signup`
  - login page now links directly to signup
- backend register flow alignment:
  - `POST /api/v1/auth/register` now also sets refresh token cookie (`httpOnly`) for consistent session behavior
- API layer update:
  - added `registerUser` helper in `frontend/src/lib/api.ts` with `credentials: "include"`
- backend integration test coverage:
  - updated `backend/tests/phase2.integration.test.ts` with register endpoint assertion for JWT + refresh cookie
- validation checks passed:
  - `npm --prefix backend run test`
  - `npm --prefix backend run build`
  - `npm --prefix frontend run lint`
  - `npm --prefix frontend run build`

### Next Tasks
- Continue Phase 5 in strict order: `5.3` (`POST /auth/refresh` + auto-refresh interceptor on 401).

### Task 5.3
- Implement `POST /auth/refresh`; add axios interceptor to auto-refresh on 401

Status: complete. Implemented:
- backend refresh endpoint:
  - added `POST /api/v1/auth/refresh` in `backend/src/routes/auth.ts`
  - reads refresh token from httpOnly cookie
  - verifies refresh token and active user
  - rotates refresh cookie and issues new access token
- backend middleware/session plumbing:
  - added `cookie-parser` middleware in `backend/src/server.ts`
  - added refresh token utilities in `backend/src/lib/auth.ts`:
    - `signRefreshToken`
    - `verifyRefreshToken`
- frontend HTTP client/interceptor:
  - added axios client wrapper in `frontend/src/lib/http.ts`
  - request interceptor injects in-memory access token
  - response interceptor handles `401` by calling refresh handler once, then retries original request
- frontend auth provider integration:
  - `frontend/src/auth/AuthProvider.tsx` now syncs token into HTTP layer
  - provider registers refresh handler using `refreshSession` API
  - failed refresh clears session state
- API layer updates:
  - migrated API calls to axios-backed helpers in `frontend/src/lib/api.ts`
  - added `refreshSession` helper (`POST /api/v1/auth/refresh`)
- backend integration tests:
  - `backend/tests/phase2.integration.test.ts` now includes:
    - refresh success with valid cookie
    - refresh failure when cookie is missing
- dependency updates:
  - backend: `cookie-parser`, `@types/cookie-parser`
  - frontend: `axios`
- validation checks passed:
  - `npm --prefix backend run test`
  - `npm --prefix backend run build`
  - `npm --prefix frontend run lint`
  - `npm --prefix frontend run build`

### Next Tasks
- Continue Phase 5 in strict order: `5.4` (ProtectedRoute redirect to `/login` when unauthenticated).

### Task 5.4
- Add `ProtectedRoute` wrapper; redirect to `/login` if no valid token

Status: complete. Implemented:
- added `ProtectedRoute` component in `frontend/src/App.tsx`
  - checks auth context session state (`isAuthenticated`)
  - redirects unauthenticated users to `/login`
  - preserves attempted path in router state (`from`) for post-login redirect
- wrapped MyTrips route in protected shell:
  - `/my-trips` now requires active authenticated session
  - signed-out access immediately redirects to `/login`
- existing login page already consumes redirect state and navigates back after successful auth
- validation checks passed:
  - `npm --prefix frontend run lint`
  - `npm --prefix frontend run build`
  - `npm --prefix backend run test`
  - `npm --prefix backend run build`

### Next Tasks
- Continue Phase 5 in strict order: `5.5` (AdminPanel page for admin route management).

### Task 5.5
- Build AdminPanel page (protected, role=admin): table of routes with Edit/Delete

Status: complete. Implemented:
- added admin route management UI:
  - `frontend/src/components/AdminPanel.tsx`
  - route table renders route name/origin/destination/corridor/baseFare
  - inline edit controls for route metadata
  - delete action with confirmation prompt
- added admin route protection:
  - `AdminRoute` wrapper in `frontend/src/App.tsx`
  - `/admin` route now requires authenticated admin role
  - non-admin users are redirected out of admin page
- added admin API wiring in `frontend/src/lib/api.ts`:
  - `updateRouteAdmin` -> `PUT /api/v1/routes/:routeId`
  - `deleteRouteAdmin` -> `DELETE /api/v1/routes/:routeId`
- updated top navigation:
  - admin users now see `Admin` navigation entry
- added admin-specific styling in `frontend/src/App.css`
- validation checks passed:
  - `npm --prefix frontend run lint`
  - `npm --prefix frontend run build`
  - `npm --prefix backend run test`
  - `npm --prefix backend run build`

### Next Tasks
- Continue Phase 5 in strict order: `5.6` (route creation form in AdminPanel using `POST /routes`).

### Task 5.6
- Add route creation form in AdminPanel; calls `POST /routes` with all fields

Status: complete. Implemented:
- extended AdminPanel UI with full route creation form in:
  - `frontend/src/components/AdminPanel.tsx`
- form captures required create payload fields:
  - `name`, `origin`, `destination`, `baseFare`
  - `polyline` (parsed from `lng,lat | lng,lat | ...`)
- form also captures optional route metadata:
  - `corridor`
  - `aliases` (comma-separated)
  - `transportType`
  - `confidenceScore`
- added frontend admin create API helper in `frontend/src/lib/api.ts`:
  - `createRouteAdmin` -> `POST /api/v1/routes`
- added client-side validation for:
  - valid positive fare
  - confidence range `0..1`
  - polyline coordinate parsing/validation
- added corresponding admin creation styles in `frontend/src/App.css`
- after successful route creation, route table reloads automatically
- validation checks passed:
  - `npm --prefix frontend run lint`
  - `npm --prefix frontend run build`
  - `npm --prefix backend run test`
  - `npm --prefix backend run build`

### Next Tasks
- Continue Phase 5 in strict order: `5.7` (stop creation form in AdminPanel, requires backend `POST /stops` endpoint alignment).

### Task 5.7
- Add stop creation form in AdminPanel; calls `POST /stops`

Status: complete. Implemented:
- added backend stop creation validation in `backend/src/validation/requestSchemas.ts`:
  - `stopCreateSchema`
  - `validateStopCreateBody`
- added backend stop creation handler + routes in `backend/src/server.ts`:
  - `POST /api/v1/stops`
  - `POST /stops`
  - protected with `authMiddleware` + `requireRoles(["admin"])`
  - validates payload, verifies route existence, then creates stop record
- added backend integration tests in `backend/tests/phase2.integration.test.ts`:
  - `401` when auth header missing
  - `201` for admin stop creation flow
- added frontend admin API helper in `frontend/src/lib/api.ts`:
  - `createStopAdmin` -> `POST /api/v1/stops`
- added stop creation UI in `frontend/src/components/AdminPanel.tsx`:
  - route selector
  - stop name
  - stop order
  - major stop toggle
  - longitude/latitude inputs
  - submit action with client-side validation
- validation checks passed:
  - `npm --prefix backend run test`
  - `npm --prefix backend run build`
  - `npm --prefix frontend run lint`
  - `npm --prefix frontend run build`

### Next Tasks
- Continue Phase 5 in strict order: `5.8` (saved routes endpoint + home integration).

### Task 5.8
- Implement saved routes endpoint and integrate into Home (Route Finder)

Status: complete. Implemented:
- added backend saved routes endpoints in `backend/src/server.ts`:
  - `GET /api/v1/routes/saved`
  - `POST /api/v1/routes/saved`
  - `DELETE /api/v1/routes/saved/:routeId`
  - alias routes also exposed under `/routes/saved`
- backend behavior:
  - all saved-routes endpoints require authentication
  - add endpoint validates `routeId` and verifies route exists/active before save
  - add uses `$addToSet` to prevent duplicate saved route IDs
  - remove uses `$pull` to remove saved route ID
  - list endpoint populates saved route metadata and filters inactive/unusable entries
- added frontend saved-routes API helpers in `frontend/src/lib/api.ts`:
  - `getSavedRoutes`
  - `addSavedRoute`
  - `removeSavedRoute`
- integrated saved routes into Home (`frontend/src/App.tsx`):
  - loads saved routes for signed-in users
  - renders "Saved Routes" panel in Route Finder sidebar
  - supports save/unsave actions from route list with immediate UI update
  - route selection from saved list navigates to route detail view
- added UI styling for saved routes and save button state in `frontend/src/App.css`
- added backend integration tests in `backend/tests/phase2.integration.test.ts`:
  - auth required for saved routes list
  - saved routes list retrieval success
  - save route success flow
  - remove saved route success flow
- validation checks passed:
  - `npm --prefix backend run test`
  - `npm --prefix backend run build`
  - `npm --prefix frontend run lint`
  - `npm --prefix frontend run build`

### Next Tasks
- Continue Phase 5 in strict order: `5.9` (mobile responsive audit/fixes for Home, RouteView, and MyTrips).
- Include mandatory Design + Engagement applicability checks in the `5.9` completion record.

### Historical Gap Remediation (Design + Engagement)
- Implemented missed prior-phase guide items before continuing:
  - Added bot-auth ingestion endpoint:
    - `POST /api/v1/reports/bot` (also `/reports/bot`) with `x-bot-token`
  - Added `whatsapp-web.js` bot listener for structured report command ingestion
  - Aligned MyTrips replay map style with RouteView map style (`navigation-night-v1`)
- Validation checks passed:
  - `npm --prefix backend run test`
  - `npm --prefix backend run build`
  - `npm --prefix frontend run lint`
  - `npm --prefix frontend run build`

### Task 5.9
- Run mobile responsive audit and apply fixes to Home, RouteView, and MyTrips

Status: complete. Implemented:
- mobile layout + spacing refinements in `frontend/src/App.css`:
  - stronger breakpoint tuning at `1020px`, `768px`, and `560px`
  - reduced shell/card padding for small screens
  - stacked `top-nav` behavior with better wrap handling
  - improved touch targets for key controls (`44px` minimum across primary actions)
- Route Finder (Home) mobile fixes:
  - route/saved-route button readability and touch behavior improved
  - save button now scales better on narrow widths
  - map canvas height reduced progressively for smaller screens
- RouteView mobile fixes:
  - route heading stacks cleanly on small widths
  - modal/action areas better fit narrow devices
  - legend/content spacing adjusted for readability
- MyTrips mobile fixes:
  - trip card header stacks cleanly on narrow widths
  - replay map height scales down for mobile viewports
  - trip metadata chip density improved for small screens
- runtime hygiene:
  - added WhatsApp bot runtime folders to root `.gitignore`:
    - `backend/.wwebjs_auth/`
    - `backend/.wwebjs_cache/`
- Design Guide applicability check:
  - applied responsive polish consistent with existing typography/color/motion direction
  - no new unresolved high-impact design gaps introduced for completed scope
- Engagement Guide applicability check:
  - mobile usability improvements were applied to engagement-critical flows:
    - report interaction surfaces
    - saved-route retention surface on Home
- validation checks passed:
  - `npm --prefix frontend run lint`
  - `npm --prefix frontend run build`

### Next Tasks
- Continue Phase 5 in strict order: `5.10` (loading skeleton states).

### Task 5.10
- Implement loading skeleton states for high-frequency user flows

Status: complete. Implemented:
- added shared skeleton shimmer system in `frontend/src/App.css`:
  - reusable skeleton primitives (`line`, `pill`, `block`, `card`)
  - shimmer animation for perceived progress during API loads
- Route Finder loading skeletons (`frontend/src/App.tsx`):
  - route list now renders skeleton cards while `GET /routes` is loading
  - saved-routes panel now renders skeleton cards while `GET /routes/saved` is loading
- Search typeahead loading skeleton (`frontend/src/components/SearchInput.tsx`):
  - replaced plain "Searching..." text with dropdown skeleton items
- Route detail loading skeleton (`frontend/src/components/RouteView.tsx`):
  - route header/meta placeholders
  - map placeholder block
  - ordered stop placeholder rows
- Fare estimate loading skeleton (`frontend/src/components/FareEstimate.tsx`):
  - skeleton state shown when estimate is fetching and no estimate is cached
- MyTrips loading skeleton (`frontend/src/App.tsx`):
  - trip history list now shows trip-card skeleton placeholders while loading
- Design Guide applicability check:
  - loading placeholders preserve existing visual language and avoid abrupt content shifts
  - motion remains restrained and consistent with existing UI animation style
- Engagement Guide applicability check:
  - skeletons now cover high-frequency engagement surfaces:
    - route discovery/search selection
    - saved-routes retention surface
    - fare insight retrieval
    - trip history revisit flow
- validation checks passed:
  - `npm --prefix frontend run lint`
  - `npm --prefix frontend run build`

### Historical Gap Remediation (Phase 4 Engagement Gamification)
- implemented engagement gamification baseline across backend + frontend:
  - user model extensions for gamification state:
    - `engagementPoints`
    - `level`
    - `tripCount`
    - `tripStreak`
    - `lastTripDate`
    - `totalDistanceMeters`
  - new backend engagement service:
    - trip/report points awarding
    - streak updates
    - badge unlock logic
    - level + airtime progression
  - engagement-aware endpoints:
    - `GET /api/v1/engagement/me`
    - `GET /api/v1/engagement/leaderboard`
  - trip/report handlers now trigger engagement updates:
    - `POST /api/v1/trips`
    - `POST /api/v1/reports`
    - `POST /api/v1/fare/report`
  - MyTrips engagement UI added:
    - points, level progress, trip streak, badges, leaderboard preview
- Design Guide applicability check:
  - engagement panel follows current palette/typography/motion conventions
  - layout remains responsive with no new design regressions introduced
- Engagement Guide applicability check:
  - phase-4 gamification loop is now active rather than deferred
  - retention signals now tied to explicit reward/progression feedback
- validation checks passed:
  - `npm --prefix backend run test`
  - `npm --prefix backend run build`
  - `npm --prefix frontend run lint`
  - `npm --prefix frontend run build`

### Task 5.11
- Implement saved-routes empty state UX with clear call-to-action guidance

Status: complete. Implemented:
- Home saved-routes empty state enhancement in `frontend/src/App.tsx`:
  - added explicit onboarding copy when no saved routes exist
  - added direct CTA to save currently selected route
  - added fallback CTA to browse route list from clean state
- saved-routes empty-state styling in `frontend/src/App.css`:
  - dedicated empty-state card treatment
  - action-row button layout for desktop and mobile
  - touch-target parity preserved on small screens
- Design Guide applicability check:
  - empty-state layout aligns with existing card language and color system
  - action hierarchy is visually clear with primary/secondary CTA separation
- Engagement Guide applicability check:
  - empty-state now actively supports retention by guiding first save action
  - reduced dead-end state for signed-in users in Route Finder sidebar
- validation checks passed:
  - `npm --prefix frontend run lint`
  - `npm --prefix frontend run build`

### Task 5.12
- Add global error boundary with user-friendly fallback and recovery controls

Status: complete. Implemented:
- added root error boundary component:
  - `frontend/src/components/GlobalErrorBoundary.tsx`
  - catches uncaught render/lifecycle errors under app root
  - logs diagnostic context to console and generates incident id
- wired boundary at app entrypoint:
  - `frontend/src/main.tsx` now wraps router/app tree with `GlobalErrorBoundary`
- added fallback UX styling:
  - `frontend/src/App.css` now includes boundary fallback shell/card/action styles
  - fallback actions: try again, go to route finder, full reload
  - mobile CTA sizing and layout maintained
- Design Guide applicability check:
  - fallback screen uses existing card typography/palette direction
  - primary/secondary action hierarchy is explicit and consistent
- Engagement Guide applicability check:
  - unexpected errors now fail into a trust-preserving recovery flow instead of blank screen
  - user has clear path to continue route discovery immediately
- validation checks passed:
  - `npm --prefix frontend run lint`
  - `npm --prefix frontend run build`

### Task 5.13
- Add Playwright E2E coverage for Phase 5 critical user flows

Status: complete. Implemented:
- Playwright test tooling added in frontend:
  - dependency: `@playwright/test`
  - config: `frontend/playwright.config.ts`
  - scripts:
    - `npm run test:e2e:list`
    - `npm run test:e2e`
- E2E suite added:
  - `frontend/e2e/phase5-auth-save-report.spec.ts`
  - covered flows:
    - auth login redirect path
    - saved-route save action and saved panel update
    - incident report submission via traffic modal
- deterministic API mocking strategy:
  - mocked `/api/v1/**` responses in test file for reliable local runs
  - CORS/preflight handling included in mocked responses
- runtime test hygiene:
  - added `playwright-report/` and `test-results/` to `frontend/.gitignore`
  - installed Chromium via Playwright for local execution
- Design Guide applicability check:
  - E2E flows target polished user-facing journeys to prevent UI regressions in completed phase-5 scope
- Engagement Guide applicability check:
  - E2E coverage explicitly validates key engagement loops:
    - login access path
    - saved-route retention action
    - report submission action
- validation checks passed:
  - `npm --prefix frontend run lint`
  - `npm --prefix frontend run build`
  - `npm --prefix frontend run test:e2e`

### Next Tasks
- Continue Phase 5 in strict order: `5.14` (user acceptance test + fixes).

### Task 5.14
- Run user acceptance test (UAT) for completed Phase 5 scope and apply fixes

Status: complete. Implemented:
- UAT validation run completed and documented:
  - `docs/phase5-step514-validation.md`
- acceptance checks covered:
  - auth session flow and protected route behavior
  - saved-route retention loop
  - report submission loop
  - admin route surface availability
  - production build quality checks
- fix applied from UAT findings:
  - reduced initial frontend payload pressure by lazy-loading heavy modules:
    - `RouteMap` (`frontend/src/components/RouteView.tsx`)
    - `MyTripMap` (`frontend/src/App.tsx`)
    - `AdminPanel` (`frontend/src/App.tsx`)
  - added Vite manual chunk strategy in:
    - `frontend/vite.config.ts`
  - build output now splits large dependencies into dedicated chunks while preserving behavior
- Design Guide applicability check:
  - improved first-load UX by reducing up-front JS execution pressure on core route finder shell
  - added loading fallbacks for lazy modules to avoid abrupt blank states
- Engagement Guide applicability check:
  - repeat-use loops remain validated through UAT:
    - saved-route retention path
    - incident report submission path
  - reduced load-time friction on route discovery supports engagement continuity
- validation checks passed:
  - `npm --prefix backend run test`
  - `npm --prefix backend run build`
  - `npm --prefix frontend run lint`
  - `npm --prefix frontend run build`
  - `npm --prefix frontend run test:e2e`

### Next Tasks
- Phase 5 is complete through `5.14`.
- Continue with Phase 6 in strict order after confirmation.

## Phase 6 - Production Hardening & Deployment

### Task 6.1
- Create Vercel project; link GitHub repo; set `VITE_MAPBOX_KEY` + `VITE_API_BASE` env vars

Status: complete. Implemented:
- linked repo to Vercel project:
  - project: `eldrens-projects/ultima`
  - local link metadata generated at `.vercel/project.json`
- connected GitHub repository:
  - `https://github.com/Eldren-cmd/naija-bus`
- configured frontend runtime env vars on Vercel for:
  - `production`
  - `preview`
  - `development`
- env vars set:
  - `VITE_MAPBOX_KEY` (from local `frontend/.env`)
  - `VITE_API_BASE` (temporary placeholder until backend service URL exists)
- local ignore hygiene updated:
  - root `.gitignore` includes `.vercel`

Design Guide applicability check:
- no direct UI changes in this step.
- production map rendering prerequisites are now in place via hosted `VITE_MAPBOX_KEY` config.

Engagement Guide applicability check:
- no direct engagement feature logic changed in this step.
- deployment prerequisite for engagement loops (saved routes + live report surfaces) is advanced.

validation checks passed:
- `vercel --version`
- `vercel env ls` (both required vars present in all three environments)
- `npm --prefix frontend run build`

deferred note:
- `VITE_API_BASE` is intentionally temporary in `6.1` and will be replaced with the real backend URL in `6.2`.

### Next Tasks
- Continue Phase 6 in strict order: `6.2` (backend hosting service + backend env vars).

### Task 6.2
- Create Render/Railway backend service; set all backend env vars

Status: complete. Implemented:
- created Render web service:
  - name: `naija-bus-backend`
  - id: `srv-d6d5r0vfte5s73d66880`
  - URL: `https://naija-bus-backend.onrender.com`
  - repo: `https://github.com/Eldren-cmd/naija-bus`
  - root directory: `backend`
- configured backend runtime/deploy settings on Render:
  - build command: `npm install --include=dev && npm run build`
  - start command: `npm run start`
  - health path: `/api/v1/health`
- set backend environment variables from local backend config with production-safe overrides:
  - `PORT=10000`
  - `NODE_ENV=production`
  - `MONGO_URI`, `JWT_SECRET`, auth/rate-limit/bot keys
  - `CORS_ORIGIN` set to Vercel domain
- updated Vercel frontend env so hosted app targets live backend:
  - `VITE_API_BASE=https://naija-bus-backend.onrender.com`
  - applied to `production`, `preview`, and `development`
- deployment incident fixes completed during 6.2:
  - initial build failed because dev dependencies were excluded in install
  - fixed by updating Render build command to include dev dependencies
  - runtime initially failed due Atlas network access
  - resolved after Atlas network access update and redeploy

Design Guide applicability check:
- no direct UI component changes in this step.
- production API availability now supports design-intended live map/fare/report interactions outside localhost.

Engagement Guide applicability check:
- no new engagement feature added directly in this task.
- engagement loops from prior phases are now reachable via public backend endpoint.
- free-tier cold-start latency is tracked as an operational risk and will be handled in `6.13` uptime monitoring (can be executed earlier operationally without marking `6.13` complete).

validation checks passed:
- Render service created and visible via API listing.
- Render service deploy status reached `live`.
- `GET https://naija-bus-backend.onrender.com/api/v1/health` returns:
  - `status: ok`
  - `database: connected`
- `vercel env ls` confirms `VITE_API_BASE` and `VITE_MAPBOX_KEY` present in all environments.

### Next Tasks
- Continue Phase 6 in strict order: `6.3` (production Atlas cluster + backups).

### Task 6.3
- Create production Atlas cluster and enable automated backups

Status: complete. Implemented:
- provisioned production Atlas cluster:
  - cluster: `naija-transport-prod`
  - plan class: `FLEX`
- validated backup snapshot screen for production cluster:
  - backup tab: `Snapshots`
  - first scheduled snapshot visible (`Next estimated snapshot: 02/23/26 - 03:29 AM`)
  - current snapshot count confirmed as expected during initial setup (`0` before first run)
- validated backup policy configuration:
  - frequency unit: `Daily Snapshot`
  - interval: every `24 Hours`
  - retention: `8 Days`
  - snapshot time: `03:29 GMT+1`
  - expected retained snapshots: approximately `8`
- manual fallback path confirmed:
  - `Take Snapshot Now` is available for immediate snapshot creation when needed

Design Guide applicability check:
- no direct UI component changes in this step.
- production data durability setup reduces risk of user-facing data loss in deployed route/fare/report experiences.

Engagement Guide applicability check:
- no direct feature-loop logic changed in this task.
- report/trip/saved-route engagement data now has production backup coverage, supporting retention and trust for repeat users.

validation checks passed:
- Atlas `Backup -> Snapshots` screen verified for `naija-transport-prod`
- Atlas `Backup -> Backup Policy` settings verified:
  - `Daily Snapshot`
  - `24 Hours`
  - `8 Days`
  - `03:29 GMT+1`
- evidence documented in:
  - `docs/phase6-step63-validation.md`

### Next Tasks
- Continue Phase 6 in strict order: `6.4` (seed production DB and verify on live frontend).

### Task 6.4
- Seed production DB and verify on live frontend

Status: complete. Implemented:
- seeded production data using production Atlas URI:
  - executed `node scripts/seed.js` with temporary `MONGO_URI` override from `MONGO_URI_PROD`
  - seed results:
    - total routes: `5`
    - total stops: `25`
    - stops inserted/updated: `25`
- verified live backend now reads the same production dataset:
  - `GET https://naija-bus-backend.onrender.com/api/v1/routes`
  - route IDs from live API match seeded production route IDs (`5/5`)
  - latest route `updatedAt` reflects production reseed window
- remediated live frontend deployment and refresh behavior:
  - added root `vercel.json` monorepo build/output config:
    - install: `npm --prefix frontend install`
    - build: `npm --prefix frontend run build`
    - output: `frontend/dist`
  - added SPA rewrite rule to serve `index.html` on client routes
  - added `.vercelignore` to exclude backend/runtime folders from frontend deployment payload
    - resolved deployment failure caused by locked WhatsApp session file in `backend/.wwebjs_auth`
  - redeployed production frontend on Vercel alias:
    - `https://ultima-pi.vercel.app`
- verified live frontend route-refresh behavior:
  - `GET /` returns `200`
  - `GET /route/:routeId` returns `200` and serves `index.html`
  - deployed bundle contains production API base (`naija-bus-backend.onrender.com`)

Design Guide applicability check:
- no new component-level visual redesign in this step.
- deployment and rewrite hardening ensure designed route/fare/report surfaces load consistently after direct-link refreshes.

Engagement Guide applicability check:
- no new engagement logic was introduced directly in this task.
- production seeded data and stable hosted routing support reliable access to engagement loops already shipped (saved routes, reporting, trips).

validation checks passed:
- production seed command completed with `5` routes and `25` stops
- live API route IDs match production-seeded IDs (`5/5`)
- Vercel production alias health:
  - `https://ultima-pi.vercel.app` -> `200`
  - `https://ultima-pi.vercel.app/route/{routeId}` -> `200`
- evidence documented in:
  - `docs/phase6-step64-validation.md`

### Next Tasks
- Continue Phase 6 in strict order: `6.5` (production CORS allowlist hardening).

### Task 6.5
- Harden production CORS allowlist behavior for HTTP and realtime channels

Status: complete. Implemented:
- backend HTTP CORS hardening in `backend/src/server.ts`:
  - added explicit comma-separated allowlist resolver (`CORS_ALLOWED_ORIGINS`)
  - retained backward-compatible single-origin fallback (`CORS_ORIGIN`)
  - added production fail-fast guard when no allowlist is configured
  - blocked wildcard `*` allowlist usage
  - normalized origins before membership checks
- realtime CORS hardening in `backend/src/realtime/reportsSocket.ts`:
  - Socket.IO now uses allowlist matcher aligned with HTTP CORS policy
  - credentials support retained
- environment/doc updates:
  - `backend/.env.example` now documents preferred `CORS_ALLOWED_ORIGINS`
  - root `README.md` CORS docs updated for allowlist-first behavior

validation checks passed:
- `npm --prefix backend run test`
- `npm --prefix backend run build`
- live preflight checks against Render backend:
  - allowlisted origin responds with expected `access-control-allow-origin`
  - non-allowlisted origin no longer receives permissive static/wildcard CORS behavior
- evidence documented in:
  - `docs/phase6-step65-validation.md`

Design Guide applicability check:
- no direct UI component changes in this step.
- API/realtime reliability hardening reduces cross-origin integration breakage in user-facing map/report flows.

Engagement Guide applicability check:
- protects engagement-critical endpoints (auth, report, trip, realtime) from unauthorized cross-origin access patterns.
- improves trust and operational stability for repeat commuter interactions.

### Next Tasks
- Continue Phase 6 in strict order: `6.6` (HTTPS/HSTS/cookie security hardening).

### Task 6.6
- Harden HTTPS transport, HSTS policy, and refresh-cookie security for production

Status: complete. Implemented:
- backend transport hardening in `backend/src/server.ts`:
  - added `TRUST_PROXY_HOPS` support and production `trust proxy` configuration
  - added forwarded-proto aware secure request detection for reverse-proxy deployments
  - added `ENFORCE_HTTPS` guard with `308` redirect for non-secure production requests
  - added `Strict-Transport-Security` header support using `HSTS_MAX_AGE_SECONDS`
- auth refresh-cookie hardening in `backend/src/routes/auth.ts`:
  - production refresh cookie policy now uses `Secure`, `HttpOnly`, and `SameSite=None`
  - optional `REFRESH_TOKEN_COOKIE_DOMAIN` support for custom-domain deployments
  - non-production cookie policy remains `SameSite=Lax`
- environment/documentation updates:
  - `backend/.env.example`
  - `README.md`

validation checks passed:
- `npm --prefix backend run test`
- `npm --prefix backend run build`
- evidence documented in:
  - `docs/phase6-step66-validation.md`

Design Guide applicability check:
- no direct visual/UI changes in this task.
- transport and cookie hardening reduce production auth/session friction on user-facing pages.

Engagement Guide applicability check:
- protects session continuity for login/report/trip loops in split-domain frontend/backend deployments.
- strengthens user trust for repeated participation in crowdsourced reporting flows.

### Next Tasks
- Continue Phase 6 in strict order: `6.7` (CI workflow for lint/test/build on push/PR).

### Task 6.7
- Add CI workflow for lint/test/build checks on push and pull requests

Status: complete. Implemented:
- added GitHub Actions workflow:
  - `.github/workflows/ci.yml`
- configured triggers:
  - `push`
  - `pull_request`
- configured Node runtime and dependency cache:
  - Node `20` via `actions/setup-node@v4`
  - npm cache keyed by:
    - `backend/package-lock.json`
    - `frontend/package-lock.json`
- backend CI job (`Backend Test and Build`):
  - `npm ci`
  - `npm run test`
  - `npm run build`
- frontend CI job (`Frontend Lint and Build`):
  - `npm ci`
  - `npm run lint`
  - `npm run build`

validation checks passed:
- `npm --prefix backend run test`
- `npm --prefix backend run build`
- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`
- evidence documented in:
  - `docs/phase6-step67-validation.md`

Design Guide applicability check:
- no direct UI component updates in this task.
- CI quality gates reduce risk of design/UX regressions reaching production.

Engagement Guide applicability check:
- CI guardrails protect engagement-critical flows (auth, report, trips, saved routes) by blocking broken merges earlier.
- improves release reliability for recurring commuter actions across future phase deliveries.

### Next Tasks
- Continue Phase 6 in strict order: `6.8` (CD workflow for frontend deploy on `main`).

### Task 6.8
- Add frontend CD workflow for production deploy on `main`

Status: complete. Implemented:
- added GitHub Actions frontend deployment workflow:
  - `.github/workflows/deploy-frontend.yml`
- trigger and scope:
  - `push` on `main`
  - path-filtered to:
    - `frontend/**`
    - `vercel.json`
    - workflow file updates
- deployment pipeline in workflow:
  - install frontend dependencies (`npm --prefix frontend ci`)
  - run frontend lint (`npm --prefix frontend run lint`)
  - run frontend build (`npm --prefix frontend run build`)
  - install Vercel CLI
  - pull Vercel production project context
  - deploy to Vercel production (`vercel deploy --prod --yes`)
- required repository secrets (already provisioned):
  - `VERCEL_TOKEN`
  - `VERCEL_ORG_ID`
  - `VERCEL_PROJECT_ID`

validation checks passed:
- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`
- `npm --prefix backend run test`
- `npm --prefix backend run build`
- evidence documented in:
  - `docs/phase6-step68-validation.md`

Design Guide applicability check:
- no direct UI component changes in this task.
- deployment automation reduces manual drift risk for shipped UI polish and layout behavior.

Engagement Guide applicability check:
- reliable production release flow supports faster and safer engagement-feature iteration.
- reduces operational friction for updates to report, trip, auth, and saved-route loops.

### Next Tasks
- Continue Phase 6 in strict order: `6.9` (CD workflow for backend deploy hook on `main`).

### Task 6.9
- Add backend CD workflow that triggers Render deploy hook on `main`

Status: complete. Implemented:
- added GitHub Actions backend deployment workflow:
  - `.github/workflows/deploy-backend.yml`
- trigger and scope:
  - `push` on `main`
  - path-filtered to:
    - `backend/**`
    - workflow file updates
- deployment pipeline in workflow:
  - install backend dependencies (`npm --prefix backend ci`)
  - run backend tests (`npm --prefix backend run test`)
  - run backend build (`npm --prefix backend run build`)
  - trigger Render deploy hook via `curl -X POST "$RENDER_DEPLOY_HOOK_URL"`
- required repository secret (already provisioned):
  - `RENDER_DEPLOY_HOOK_URL`

validation checks passed:
- `npm --prefix backend run test`
- `npm --prefix backend run build`
- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`
- evidence documented in:
  - `docs/phase6-step69-validation.md`

Design Guide applicability check:
- no direct UI component changes in this task.
- backend deploy automation helps keep deployed API behavior aligned with the reviewed frontend UX.

Engagement Guide applicability check:
- reliable backend deployment pipeline improves stability of engagement-critical loops (auth, reports, trips, saved routes).
- reduces regression risk by enforcing test/build gates before production deploy trigger.

### Next Tasks
- Continue Phase 6 in strict order: `6.10` (Sentry integration and capture validation).

### Task 6.10
- Integrate Sentry backend observability and validate capture flow

Status: complete. Implemented:
- added backend observability module:
  - `backend/src/config/observability.ts`
  - Sentry init based on `SENTRY_DSN`
  - shared capture/flush helpers
- integrated Sentry into backend runtime:
  - startup initialization in `backend/src/server.ts`
  - process-level exception hooks (`unhandledRejection`, `uncaughtExceptionMonitor`)
  - automatic capture mirror for JSON responses with status `>=500`
- added token-gated capture validation endpoint:
  - `POST /api/v1/observability/sentry-test`
  - `POST /observability/sentry-test`
  - requires header `x-sentry-test-token` matching `SENTRY_CAPTURE_TEST_TOKEN`
  - returns `202` after capture + flush attempt
- updated environment/docs:
  - `backend/.env.example`
  - `README.md`

validation checks passed:
- `npm --prefix backend run test`
- `npm --prefix backend run build`
- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`
- evidence documented in:
  - `docs/phase6-step610-validation.md`

Design Guide applicability check:
- no direct UI component changes in this task.
- observability coverage reduces risk of prolonged user-visible failures without diagnosis.

Engagement Guide applicability check:
- improves operational visibility for engagement-critical backend loops (auth/report/trip/saved routes).
- enables safer iteration by making production failures easier to detect and triage.

### Next Tasks
- Continue Phase 6 in strict order: `6.11` (structured server logging + sink integration).

### Task 6.11
- Add structured backend logging and sink-ready integration

Status: complete. Implemented:
- added structured logger module:
  - `backend/src/config/logger.ts`
  - `pino` logger with service metadata, `LOG_LEVEL` support, and secret redaction rules
- backend request logging integrated:
  - per-request JSON logs with method/path/statusCode/duration/ip/userAgent
- backend error logging integrated:
  - automatic structured log entry for JSON responses returning status `>=500`
  - structured startup/bot failure logs
  - auth-route failure logs in `backend/src/routes/auth.ts`
- sink integration:
  - logs emit to stdout in JSON format
  - Render runtime ingests stdout into centralized service log stream
- documentation/config updates:
  - `backend/.env.example` (`LOG_LEVEL`)
  - `README.md`

validation checks passed:
- `npm --prefix backend run test`
- `npm --prefix backend run build`
- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`
- evidence documented in:
  - `docs/phase6-step611-validation.md`

Design Guide applicability check:
- no direct UI component changes in this task.
- structured API logs improve incident triage for user-facing reliability issues.

Engagement Guide applicability check:
- better server diagnostics reduce resolution time for engagement-path regressions.
- supports stable repeated usage of auth/report/trip/saved-route loops.

### Next Tasks
- Continue Phase 6 in strict order: `6.12` (Mapbox billing alerts and quota guardrails).

## Supplemental UX Productization Pass

Status: complete. Implemented:
- added a conversion-focused homepage at `/`:
  - minimal nav
  - hero search
  - feature highlights
  - 3-step "How it works"
  - branded footer
- moved Route Finder workflow to `/map` (and `/search` alias) while preserving `/route/:routeId`.
- removed internal phase labels from user-facing pages and replaced with product-safe copy (`Beta`, `Account`, `Admin`, `Trip History`).
- route list/search loading behavior hardened:
  - no route query call on first `/map` load until user submits a search query.
- production brand polish updates:
  - title updated to `Naija Transport — Lagos Route & Fare Finder`
  - meta description added for search/preview quality
  - custom favicon added (`frontend/public/favicon.svg`)
- deployment/domain polish:
  - production deployment updated
  - readable alias assigned: `https://naijatransport.vercel.app`

Design Guide applicability check:
- improved visual hierarchy and first-screen clarity for public visitors before entering core app flow.
- strengthened palette presence with brand-orange emphasis on hero, CTA, and interactive elements.

Engagement Guide applicability check:
- lower-friction first-use flow improves top-of-funnel conversion into route search and subsequent report/trip loops.
- removing startup error noise improves trust and repeat usage probability.

## Supplemental Auth + Search UX Hardening Pass

Status: complete. Implemented:
- redesigned login and signup pages with branded high-contrast shell and structured card hierarchy:
  - `frontend/src/components/LoginPage.tsx`
  - `frontend/src/components/SignupPage.tsx`
- removed internal implementation-only account copy from user-facing auth pages.
- added stronger field affordances for auth:
  - explicit visible borders
  - focus styles
  - password show/hide controls
  - inline password strength + confirm-match feedback
  - submit loading states with spinner
- route-search trigger hardening:
  - removed typeahead API side-effect from `frontend/src/components/SearchInput.tsx`
  - route fetch remains explicit through form submit path
- brand action polish:
  - route-search submit button updated to orange brand treatment in `frontend/src/App.css`

Design Guide applicability check:
- auth surfaces now align with brand contrast, hierarchy, and interaction feedback expectations.
- route-search primary action now carries clear visual priority tied to brand palette.

Engagement Guide applicability check:
- reduced first-use confusion and trust friction on auth entry surfaces.
- startup error noise reduced by avoiding auto-search API behavior before user submit.

validation checks passed:
- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`
