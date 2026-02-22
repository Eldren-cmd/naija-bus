# Phase 6 Task 6.4 Validation

Date: 2026-02-22  
Scope: Production seed execution and live frontend verification.

## Executed Checks

1. Seed production cluster using `MONGO_URI_PROD`:
   - temporary shell override of `MONGO_URI`
   - `node scripts/seed.js`
2. Compare seeded production route IDs with live backend API route IDs:
   - production DB query via mongoose
   - `GET https://naija-bus-backend.onrender.com/api/v1/routes`
3. Verify hosted frontend availability and route refresh behavior:
   - `HEAD https://ultima-pi.vercel.app`
   - `HEAD https://ultima-pi.vercel.app/route/{routeId}`
4. Verify hosted frontend bundle targets live backend:
   - fetch main JS bundle from `ultima-pi.vercel.app`
   - check for `naija-bus-backend.onrender.com` string

## Outcomes

- Production seed completed successfully:
  - routes: `5`
  - stops: `25`
  - inserted/updated stops in run: `25`
- Live backend and production seed are aligned:
  - live API route IDs match production-seeded IDs (`5/5`)
  - live API route count: `5`
- Hosted frontend verification:
  - root path returns `200`
  - route path refresh (`/route/:routeId`) returns `200` with `index.html`
  - main frontend bundle includes production API base to Render backend

## Deployment Remediations Applied

- Added root `vercel.json` to build and serve `frontend/dist` from monorepo root.
- Added SPA rewrite:
  - `/(.*)` -> `/index.html`
- Added `.vercelignore` to exclude backend/runtime directories from frontend deployment payload to avoid locked-file upload failures.

## Final Status

- DevPlan task `6.4` acceptance criteria is satisfied:
  - production DB is seeded
  - live backend serves seeded dataset
  - hosted frontend is reachable and route-refresh safe
