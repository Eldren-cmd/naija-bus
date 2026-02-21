# Commit 45 Social Posts

## Facebook
Commit 45 complete for Naija Transport Route & Fare Finder.

Trip history retrieval is now live:
- Added authenticated endpoint to fetch user trip history
- Added access control so users can only view their own trips
- Admin users can view any user history

## LinkedIn
Commit 45 shipped: DevPlan Task 4.2 (`GET /trips?userId=`).

Completed in this commit:
- Added:
  - `GET /api/v1/trips?userId=...`
  - `GET /trips?userId=...`
- Implemented endpoint behavior:
  - requires auth
  - validates required `userId` query param
  - enforces role-aware access (`user` vs `admin`)
  - returns latest-first trip history with route metadata population
- Expanded integration tests in `backend/tests/trips.integration.test.ts`:
  - query validation (`400`)
  - forbidden cross-user access (`403`)
  - successful same-user and admin retrieval (`200`)
- Verified backend quality checks:
  - `npm --prefix backend run test`
  - `npm --prefix backend run build`

## Twitter
Commit 45 complete.

Task 4.2 is done: `GET /trips?userId=` now returns authenticated trip history with strict access control and tests. #nodejs #express #mongodb #api
