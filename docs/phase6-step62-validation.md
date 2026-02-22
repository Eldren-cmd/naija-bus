# Phase 6 Task 6.2 Validation

Date: 2026-02-22  
Scope: Render backend service provisioning and backend env setup.

## Executed Checks

1. Render services listing via API:
   - `GET /v1/services`
2. Render deploy status checks:
   - `GET /v1/services/{serviceId}/deploys`
   - `GET /v1/services/{serviceId}/deploys/{deployId}`
3. Render env vars checks:
   - `GET /v1/services/{serviceId}/env-vars`
4. Public health check:
   - `GET https://naija-bus-backend.onrender.com/api/v1/health`
5. Vercel frontend env verification:
   - `vercel env ls`
   - `vercel env pull` preview

## Outcomes

- Render backend service created:
  - Service: `naija-bus-backend`
  - ID: `srv-d6d5r0vfte5s73d66880`
  - URL: `https://naija-bus-backend.onrender.com`
- Backend env vars configured on Render for production runtime.
- Vercel `VITE_API_BASE` updated to Render backend URL.

## Deployment Incidents and Fixes

1. Build failure (`TS7016` missing type declarations):
   - Root cause: build installed production deps only.
   - Fix: Render build command changed to:
     - `npm install --include=dev && npm run build`

2. Runtime failure (`MongooseServerSelectionError`):
   - Root cause: Atlas network access blocked Render.
   - Fix: Atlas network access updated; manual redeploy triggered.

## Final Status

- Latest deploy reached `live`.
- Public health endpoint returns:
  - `status: ok`
  - `database: connected`

## Operational Note

- On Render free tier, idle spin-down can increase first-request latency.
- Planned mitigation is Task `6.13` uptime monitoring (`/api/v1/health` keep-warm checks).
