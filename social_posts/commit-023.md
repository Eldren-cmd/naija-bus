# Commit 23 Social Posts

## Facebook
Commit 23 complete for Naija Transport Route & Fare Finder.

Route maps are now live in the frontend:
- selected route polyline renders on map
- route stops appear as markers
- fallback message shows if Mapbox token is missing

This completes the main Phase 2 map rendering task.

## LinkedIn
Commit 23 shipped: Phase 2 map rendering.

Completed in this commit:
- Added Mapbox integration in `frontend/src/components/RouteMap.tsx`
- Rendered selected route polyline from backend GeoJSON
- Added stop marker layer for route stops
- Integrated map into RouteView (`frontend/src/components/RouteView.tsx`)
- Added token-missing fallback UX for local setup safety
- Added `mapbox-gl` frontend dependency

Validation:
- `npm --prefix frontend run build` passed
- `npm --prefix frontend run lint` passed

## Twitter
Commit 23 complete.

Map rendering is now active in RouteView:
polyline + stop markers from backend route data, with Mapbox fallback messaging when token is absent. #reactjs #mapbox #typescript #frontend
