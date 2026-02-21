# Commit 50 Social Posts

## Facebook
Commit 50 complete for Naija Transport Route & Fare Finder.

MyTrips now has route replay:
- Clicking a trip card now selects it
- Selected trip checkpoints are drawn as a map polyline
- Replay map auto-focuses on the selected trip path

## LinkedIn
Commit 50 shipped: DevPlan Task 4.7 (MyTrips map replay from stored checkpoints).

Completed in this commit:
- Added `MyTripMap` component:
  - builds GeoJSON `LineString` from stored `trip.checkpoints`
  - renders selected trip path on Mapbox
  - fits bounds to selected trip route
- Updated MyTrips page flow in `frontend/src/App.tsx`:
  - card-click selection state
  - active-card styling support
  - selected trip wired into replay map
- Added MyTrips map panel + selected card styles in `frontend/src/App.css`
- Updated project tracking docs:
  - `docs/step-checkpoints.md`
  - `docs/devplan-audit-phase4.md`
  - `README.md`
  - `frontend/README.md`

Validation:
- `npm --prefix frontend run lint` passed
- `npm --prefix frontend run build` passed

## Twitter
Commit 50 complete.

Task 4.7 is done: MyTrips card selection now redraws stored checkpoint polylines on a replay map (GeoJSON + Mapbox). #reactjs #typescript #mapbox #geospatial
