# Commit 16 Social Posts

## Facebook
Commit 16 complete for Naija Transport Route & Fare Finder.

We now support route detail retrieval by ID, including ordered stops, which is required for the RouteView experience.

Added:
- `GET /routes/:routeId`
- `GET /api/v1/routes/:routeId`

## LinkedIn
Commit 16 shipped: Phase 2 Task 2.2.

Completed in this commit:
- Added route-by-id endpoint
- Returns full route payload plus ordered stop list
- Added routeId validation and clear error handling:
  - invalid ID -> 400
  - missing route -> 404

Verified live against seeded Atlas data.

## Twitter
Commit 16 ✅
`GET /routes/:routeId` is live.

Behavior:
- valid ID -> `200` + route + ordered stops
- invalid ID -> `400`
- unknown ID -> `404`

Next: admin CRUD routes. #nodejs #mongodb #api
