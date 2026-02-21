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

## Environment
Create `frontend/.env` with:

```
VITE_API_BASE=http://localhost:5000
VITE_MAPBOX_KEY=replace_with_mapbox_token_when_phase2_starts
```

## Commands
- `npm run dev`
- `npm run build`
- `node scripts/phase3-step313-realtime-check.mjs` (Task 3.13 realtime demo validation)

## Report Fare UI Note
- The report panel requires a valid JWT from backend login/register.
- Paste token into the UI once; it is stored in browser local storage for repeat submissions.

## Traffic Report UI Note
- The traffic report modal also requires a valid JWT token.
- Location can be auto-filled through browser geolocation or entered manually.
