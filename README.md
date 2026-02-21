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

## Working Rules for This Build
- Move step-by-step in task order.
- Pause after each completed step and confirm before moving to the next.
- Commit frequently.
- Store a Facebook/LinkedIn/Twitter post after each commit in `social_posts/`.
- Keep secrets out of git.

## Note on GitHub Visibility
The project uses a **private** GitHub repository at `origin` with `main` pushed.

## Environment Setup
1. Copy `backend/.env.example` to `backend/.env`.
2. Copy `frontend/.env.example` to `frontend/.env` when frontend API/map integration begins.
3. Never commit real secrets.

### Backend Required Keys
- `PORT`: API port (`5000` for local dev).
- `NODE_ENV`: runtime mode (`development` for local work).
- `MONGO_URI`: MongoDB Atlas connection string.
- `JWT_SECRET`: long random secret used to sign/verify access tokens.
- `JWT_EXPIRES_IN`: token duration (for example `7d`).
- `CORS_ORIGIN`: allowed frontend origin (local default `http://localhost:5173`).

### Backend Optional Keys
- `SEARCH_RATE_LIMIT_WINDOW_MS`: window size for `/search` rate limit.
- `SEARCH_RATE_LIMIT_MAX`: max requests per window for `/search`.
- `ROUTES_RATE_LIMIT_WINDOW_MS`: window size for `/routes` rate limit.
- `ROUTES_RATE_LIMIT_MAX`: max requests per window for `/routes`.
- `JWT_REFRESH_SECRET`: refresh token signing secret (falls back to `JWT_SECRET` if omitted).
- `JWT_REFRESH_EXPIRES_IN`: refresh token expiry (default `30d`).
- `REFRESH_TOKEN_COOKIE_NAME`: cookie key used for refresh token storage (`naija_refresh_token` default).

### Frontend Keys
- `VITE_API_BASE`: backend base URL used by frontend API calls.
- `VITE_MAPBOX_KEY`: Mapbox token (required from Phase 2 map work onward).

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
