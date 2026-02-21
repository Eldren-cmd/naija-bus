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
