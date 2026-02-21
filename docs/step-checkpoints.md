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
