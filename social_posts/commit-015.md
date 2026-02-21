# Commit 15 Social Posts

## Facebook
Commit 15 complete for Naija Transport Route & Fare Finder.

Phase 2 has started. We implemented route discovery filters on the backend:
- text search via `q`
- map viewport filtering via `bbox`

This is the first core MVP API upgrade for real route search behavior.

## LinkedIn
Commit 15 shipped: Phase 2 Task 2.1.

Completed in this commit:
- Upgraded `GET /api/v1/routes` with query support:
  - `?q=` text filtering
  - `?bbox=minLng,minLat,maxLng,maxLat` geospatial filtering
- Added bbox validation with `400` error on invalid input
- Added alias endpoint compatibility: `GET /routes`
- Verified behavior against seeded Atlas data

Phase 2 is now underway with the first endpoint milestone complete.

## Twitter
Commit 15 ✅
Phase 2 started.

`GET /routes` now supports:
- `q` text search
- `bbox` geo filter

Verified with seeded DB data + invalid bbox handling (`400`). Next: `GET /routes/:routeId`. #nodejs #mongodb #maps
