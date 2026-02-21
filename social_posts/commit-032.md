# Commit 32 Social Posts

## Facebook
Commit 32 complete for Naija Transport Route & Fare Finder.

Added live viewport reports API:
- New `GET /api/v1/reports?bbox=minLng,minLat,maxLng,maxLat`
- Returns active reports only within the visible map area
- Includes validation for missing/invalid bbox

## LinkedIn
Commit 32 shipped: Phase 3 Task 3.3 (viewport reports query endpoint).

Completed in this commit:
- Implemented `GET /api/v1/reports` and `GET /reports` with required `bbox` query
- Added geospatial filtering via `$geoWithin` polygon bounds
- Added default sorting (`createdAt` descending) and response limit
- Added integration tests in `backend/tests/reports.integration.test.ts`:
  - missing bbox -> 400
  - invalid bbox -> 400
  - valid bbox -> 200
- Realigned project checkpoint numbering with `NaijaTransport_DevPlan.docx`

Validation:
- backend build passed
- backend test suite passed

## Twitter
Commit 32 complete.

Added `GET /reports?bbox=` to serve active incident reports by map viewport, with validation and test coverage. This unlocks map marker loading for realtime phase tasks. #nodejs #express #mongodb #geospatial
