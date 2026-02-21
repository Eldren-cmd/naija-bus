# Commit 18 Social Posts

## Facebook
Commit 18 complete for Naija Transport Route & Fare Finder.

Nearby stop discovery is now live:
- `GET /api/v1/stops?near=lng,lat&radius=500`

This endpoint uses geospatial search to return stops close to a rider's location.

## LinkedIn
Commit 18 shipped: Phase 2 Task 2.4.

Completed in this commit:
- Added nearby-stops endpoint:
  - `GET /api/v1/stops`
  - alias: `GET /stops`
- Implemented `near=lng,lat` parsing and validation
- Added optional `radius` (meters), with sensible default and safety cap
- Used MongoDB geospatial query (`$nearSphere`) on stop coordinates
- Included route summary details in nearby stop response

Live verification results:
- valid query -> `200`
- missing `near` -> `400`
- invalid `near` -> `400`
- invalid `radius` -> `400`

## Twitter
Commit 18 complete.

Added nearby stop lookup:
`GET /stops?near=lng,lat&radius=500`

Geospatial search is now active with input validation and route summary in response.
Checks: valid `200`, bad input `400`. #nodejs #express #mongodb
