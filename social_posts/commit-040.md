# Commit 40 Social Posts

## Facebook
Commit 40 complete for Naija Transport Route & Fare Finder.

Live incident visibility is now on the map:
- Added report marker layer to RouteView map
- Markers are color-coded by severity (high, medium, low)
- Marker sizes now scale by severity
- Users can click a marker to view a quick incident summary

## LinkedIn
Commit 40 shipped: DevPlan Task 3.9 (Map report markers with severity coding).

Completed in this commit:
- Added frontend API helper to fetch reports by viewport bbox (`GET /api/v1/reports?bbox=`)
- Extended frontend types for bbox/report mapping
- Updated RouteMap to:
  - load active reports in the selected route viewport
  - render incident markers as a dedicated map layer
  - apply severity-based color + size encoding
  - expose marker click popups with incident summary
- Added report legend + live report count under map
- Updated strict tracking docs and audits

Validation:
- frontend lint passed
- frontend build passed

## Twitter
Commit 40 complete.

Task 3.9 is done: map now shows severity-coded incident markers from `GET /reports?bbox=` with click summaries. #mapbox #reactjs #typescript #realtime
