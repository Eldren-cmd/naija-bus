# Final Production Demo Pack

Date: 2026-02-22  
Scope: Phase 6 Task 6.15 final production README/demo packaging

## Production Endpoints

- Frontend: `https://naijatransport.vercel.app`
- Backend: `https://naija-bus-backend.onrender.com`
- Health endpoint: `https://naija-bus-backend.onrender.com/api/v1/health`

## Pre-Demo Checklist

1. Confirm frontend loads:
   - open `https://naijatransport.vercel.app`
2. Confirm backend health:
   - open `https://naija-bus-backend.onrender.com/api/v1/health`
   - expected: `{"status":"ok","service":"backend","database":"connected"}`
3. Confirm seeded route data exists:
   - `GET /api/v1/routes` should return at least `5` routes.
4. Confirm map token restrictions:
   - Mapbox token is public (`pk...`)
   - URL restrictions include localhost and production domain.
5. Confirm monitoring baseline:
   - uptime workflow exists (`.github/workflows/uptime-health-check.yml`)
   - security audit workflow exists (`.github/workflows/security-audit.yml`)

## Demo Script (Live)

1. Homepage conversion flow
   - Open `/`
   - Show hero value proposition and quick route actions.
2. Route search flow
   - Go to `/map`
   - Search `Ojota` (or `Ojota -> CMS`).
   - Confirm route list appears.
3. Route detail + map flow
   - Select a route.
   - Confirm ordered stops render and route map loads.
4. Fare estimate flow
   - Change time/traffic inputs.
   - Confirm fare estimate and confidence update.
5. Report loop flow
   - Submit fare report or incident report (authenticated).
   - Confirm success feedback and map marker visibility.
6. Trip recording flow
   - Start trip recorder, capture checkpoints, stop and upload.
   - Confirm trip appears in MyTrips history.
7. MyTrips replay flow
   - Open `/my-trips`
   - Select a trip and confirm replay map renders checkpoint path.
8. Auth + retention flow
   - Login/signup flow.
   - Save a route and show saved-routes panel behavior.

## Demo Expected Outcomes

- UI loads with production branding and no internal phase labels.
- Backend API returns healthy status and seeded route data.
- Map renders in Lagos-bounded experience with public token policy.
- Fare/report/trip loops execute without blocking errors.
- Monitoring/security baselines are visible in repo workflows and docs.

## Handoff Artifacts

- Phase 6 audit ledger: `docs/devplan-audit-phase6.md`
- Step-by-step history: `docs/step-checkpoints.md`
- Cross-phase compliance: `docs/cross-phase-compliance-audit.md`
- Engagement mapping: `docs/engagement-guide-mapping.md`
- Design audit: `docs/design-guide-audit.md`
