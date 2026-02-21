# Commit 27 Social Posts

## Facebook
Commit 27 complete for Naija Transport Route & Fare Finder.

Phase 3 Task 3.2 is now done:
- traffic/police/roadblock-style incident reporting endpoint added
- authentication and payload validation included

New endpoint:
- `POST /api/v1/reports`

## LinkedIn
Commit 27 shipped: Phase 3 Task 3.2.

Completed in this commit:
- Added incident report endpoint:
  - `POST /api/v1/reports`
  - alias: `POST /reports`
- Enforced auth protection
- Added validation for:
  - report type
  - severity
  - GeoJSON point coordinates
  - optional routeId format and route existence
- Added integration tests:
  - no auth -> `401`
  - invalid payload -> `400`
  - unknown route -> `404`
  - valid payload -> `201`

Verification:
- backend build passed
- backend tests passed (`24/24`)
- live endpoint checks passed

## Twitter
Commit 27 complete.

Added auth-protected `POST /reports` for incident submissions (traffic/police/roadblock + model enums), with validation + tests across 401/400/404/201 paths. #nodejs #express #mongodb #testing
