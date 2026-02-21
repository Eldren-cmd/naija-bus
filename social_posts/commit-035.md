# Commit 35 Social Posts

## Facebook
Commit 35 complete for Naija Transport Route & Fare Finder.

Added API protection against request flooding:
- `express-rate-limit` is now active on route search endpoints
- covers `/search` and `/routes` paths

Also refreshed the full Phase 1-3 task audit docs to keep progress strictly aligned with the development plan.

## LinkedIn
Commit 35 shipped: DevPlan Task 2.8 + full-step audit synchronization.

Completed in this commit:
- Added `express-rate-limit` backend dependency
- Added configurable rate limit middleware in `backend/src/server.ts`
- Applied limits on:
  - `GET /api/v1/search` + `GET /search`
  - `GET /api/v1/routes` + `GET /routes`
- Added optional rate-limit env keys in `backend/.env.example`
- Updated strict tracking artifacts:
  - `docs/step-checkpoints.md`
  - `docs/devplan-audit-phase1-3.md`
  - `README.md`

Validation:
- backend build passed
- backend tests passed

## Twitter
Commit 35 complete.

Task 2.8 is in: `express-rate-limit` now guards `/search` and `/routes`, with configurable env thresholds and updated audit docs for strict DevPlan alignment. #nodejs #express #api #security
