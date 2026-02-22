# Phase 6 Step 6.12 Validation

Date: 2026-02-22  
Scope: Mapbox billing alerts and frontend quota guardrails

## Local Validation

Commands:
- `npm --prefix backend run test`
- `npm --prefix backend run build`
- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`

Result:
- Passed

## Implementation Validation

Files verified:
- `frontend/src/config/mapbox.ts`
  - centralized guardrails for:
    - public-token enforcement (`pk...`)
    - Lagos map center/bounds
    - min/max zoom constraints
- `frontend/src/components/RouteMap.tsx`
  - consumes shared map guardrail config
  - applies `maxBounds`, `minZoom`, `maxZoom`, `renderWorldCopies: false`
  - invalid/secret-token fallback guidance shown in UI
- `frontend/src/components/MyTripMap.tsx`
  - consumes shared map guardrail config
  - applies same bounds/zoom guardrails for trip replay map parity
- `frontend/.env.example`
  - now uses public-token format placeholder (`pk...`)
- `README.md` and `frontend/README.md`
  - added Mapbox billing alert + URL-restriction runbook

## Mapbox Billing/Usage Checklist

Operational checklist documented and ready for dashboard application:
- Token type policy: frontend uses only public `pk...` token.
- Token URL restrictions:
  - `http://localhost:5173/*`
  - `https://naijatransport.vercel.app/*` (or active production domain)
- Usage oversight:
  - monitor token-level statistics and invoices
  - apply staged usage alerts when available on account plan
  - otherwise use external budget alerts with regular usage review

## Notes

- This step adds application-level usage guardrails and a platform runbook; it does not replace Mapbox account-side alerting, which must remain enabled in dashboard settings.
