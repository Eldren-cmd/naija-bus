# Commit 85 Social Posts

## Facebook
Commit 85 complete.

Phase 6.12 is done:
- added Mapbox quota guardrails in frontend map components
- enforced public token usage (`pk...`) for browser map rendering
- documented billing alert and token restriction setup for Mapbox account safety

## LinkedIn
Commit 85 shipped: Phase 6 Task 6.12 Mapbox billing alerts and quota guardrails.

Completed in this commit:
- Added shared map guardrail config:
  - `frontend/src/config/mapbox.ts`
  - public token validation + Lagos bounds + zoom caps
- Updated RouteView and MyTrips map rendering to enforce guardrails:
  - `frontend/src/components/RouteMap.tsx`
  - `frontend/src/components/MyTripMap.tsx`
- Updated environment and docs:
  - `frontend/.env.example`
  - `frontend/README.md`
  - `README.md`
  - `docs/devplan-audit-phase6.md`
  - `docs/step-checkpoints.md`
  - `docs/design-guide-audit.md`
  - `docs/engagement-guide-mapping.md`
  - `docs/cross-phase-compliance-audit.md`
  - `docs/phase6-step612-validation.md`

## Twitter
Commit 85 complete.

Phase 6.12 done: Mapbox billing/quota guardrails shipped with public-token enforcement, Lagos map bounds, and billing-alert runbook. #Mapbox #Frontend #DevOps #SaaS
