# Frontend (Phase 2 MVP)

React + TypeScript + Vite frontend for Naija Transport.

## Implemented in this phase
- Route search list (`GET /api/v1/routes`)
- Debounced typeahead search (`GET /api/v1/search`)
- Route detail view with ordered stops (`GET /api/v1/routes/:routeId`)
- Route URL navigation flow (`/route/:routeId`) wired through React Router
- Fare estimate panel (`GET /api/v1/fare/estimate`)
- Authenticated fare report submission panel (`POST /api/v1/fare/report`)
- Traffic report modal (`POST /api/v1/reports`) with type/severity/description + location autofill
- Route map rendering with Mapbox (polyline + stop markers)
- Severity-coded incident report markers on the route map (`GET /api/v1/reports?bbox=`)
- Realtime incident marker updates with Socket.IO (`report:created` on `/reports`)
- Toast notification feedback for report submission success/error states
- TripRecorder component with geolocation checkpoint capture cadence (every 5 seconds)
- Live in-progress trip polyline rendering on map from recorder checkpoints
- Trip preview + upload modal flow (`POST /api/v1/trips`) from recorder stop action
- MyTrips page with authenticated trip history cards (`GET /api/v1/trips?userId=...`)
- MyTrips trip replay map: selecting a trip card redraws stored checkpoint path on Mapbox
- TripRecorder geolocation-denied UX: explicit blocked-permission warning with retry guidance
- Login page (`/login`) wired to `POST /api/v1/auth/login` with in-memory access token session
- Frontend auth context/provider added; token persistence in localStorage removed
- Signup page (`/signup`) wired to `POST /api/v1/auth/register` with auto-login redirect flow
- Axios HTTP client now auto-refreshes session on `401` via `POST /api/v1/auth/refresh` and retries original request
- Protected route wrapper now redirects signed-out users from `/my-trips` to `/login`
- Admin-only `/admin` page now lists routes and supports inline edit/delete via protected backend admin endpoints
- Admin route creation form now posts full payload to protected `POST /api/v1/routes`
- Admin stop creation form now posts validated stop payloads to protected `POST /api/v1/stops`
- Home now includes signed-in saved routes panel with save/unsave route actions via `GET/POST/DELETE /api/v1/routes/saved`
- Conversion-focused public homepage now lives at `/` with hero search and route quick-links into `/map?q=...`
- Route Finder app surface now lives at `/map` (with `/search` alias) and route detail remains at `/route/:routeId`
- Saved-routes empty state now includes guided CTA actions (save selected route, browse all routes)
- Mobile responsiveness pass completed for Home, RouteView, and MyTrips (optimized breakpoints: 1020px, 768px, 560px)
- Loading skeleton states added for high-frequency views (search suggestions, route list, route detail, fare card, and MyTrips history)
- MyTrips now includes engagement panel (points, level progress, trip streak, badges, and leaderboard)
- Global React error boundary now wraps app root with fallback recovery actions (try again, route finder, reload)
- Playwright E2E suite now covers Phase 5 critical flows:
  - auth login redirect flow
  - saved-route save action and panel update
  - traffic report submission modal flow
- Phase 5 UAT remediation now includes lazy-loaded `RouteMap`, `MyTripMap`, and `AdminPanel` plus Vite manual chunk splitting for better first-load behavior
- Phase 6 Task 6.1 deployment prep completed:
  - Vercel project linked to this repo
  - hosted frontend env vars configured (`VITE_MAPBOX_KEY`, `VITE_API_BASE`)
- Phase 6 Task 6.2 backend hosting completed:
  - hosted frontend API base now points to live Render backend (`https://naija-bus-backend.onrender.com`)
- Phase 6 Task 6.12 Mapbox guardrails completed:
  - frontend only accepts public Mapbox tokens (`pk...`) and rejects secret-token usage in UI fallback
  - map render scope is constrained to Lagos bounds with zoom caps to reduce accidental tile over-consumption
  - both RouteView and MyTrips replay maps now share the same map guardrail configuration

## Environment
Create `.env.local` at repo root with:

```
VITE_API_BASE=http://localhost:5000
VITE_MAPBOX_KEY=pk.replace_with_public_mapbox_token
```

Mapbox key rule:
- Use only a public key (`pk...`) in frontend env.
- Do not use secret keys (`sk...`) in `.env.local` or browser-delivered code.

## Commands
- `npm run dev`
- `npm run build`
- `npm run test:e2e:list`
- `npm run test:e2e`
- `node scripts/phase3-step313-realtime-check.mjs` (Task 3.13 realtime demo validation)

## Report Fare UI Note
- The report panel requires a valid JWT from backend login/register.
- Token is provided automatically from in-memory auth session after login/signup.

## Traffic Report UI Note
- The traffic report modal also requires a valid JWT token.
- Location can be auto-filled through browser geolocation or entered manually.
