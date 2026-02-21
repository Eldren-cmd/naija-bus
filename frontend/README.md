# Frontend (Phase 2 MVP)

React + TypeScript + Vite frontend for Naija Transport.

## Implemented in this phase
- Route search list (`GET /api/v1/routes`)
- Route detail view with ordered stops (`GET /api/v1/routes/:routeId`)
- Fare estimate panel (`GET /api/v1/fare/estimate`)
- Authenticated fare report submission panel (`POST /api/v1/fare/report`)
- Route map rendering with Mapbox (polyline + stop markers)

## Environment
Create `frontend/.env` with:

```
VITE_API_BASE=http://localhost:5000
VITE_MAPBOX_KEY=replace_with_mapbox_token_when_phase2_starts
```

## Commands
- `npm run dev`
- `npm run build`

## Report Fare UI Note
- The report panel requires a valid JWT from backend login/register.
- Paste token into the UI once; it is stored in browser local storage for repeat submissions.
