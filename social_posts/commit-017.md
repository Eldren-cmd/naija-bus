# Commit 17 Social Posts

## Facebook
Commit 17 complete for Naija Transport Route & Fare Finder.

Admin route management endpoints are now live and protected:
- create route
- update route
- delete route

Only admin users can perform these actions.

## LinkedIn
Commit 17 shipped: Phase 2 Task 2.3.

Completed in this commit:
- Added admin-protected route CRUD endpoints:
  - `POST /api/v1/routes`
  - `PUT /api/v1/routes/:routeId`
  - `DELETE /api/v1/routes/:routeId`
- Added alias paths (`/routes` variants)
- Added request validation for payload shape, routeId, and geo polyline data
- Verified role enforcement and endpoint behavior end-to-end

Live verification results:
- no auth -> `401`
- non-admin -> `403`
- admin create -> `201`
- admin update -> `200`
- admin delete -> `200`
- deleted route fetch -> `404`

## Twitter
Commit 17 ✅
Admin route CRUD is now implemented + protected.

Checks passed:
- unauthenticated `POST /routes` -> `401`
- normal user `POST /routes` -> `403`
- admin create/update/delete -> `201/200/200`
- post-delete fetch -> `404`

Next: geospatial stops endpoint (`GET /stops?near=lng,lat&radius=500`). #nodejs #express #mongodb
