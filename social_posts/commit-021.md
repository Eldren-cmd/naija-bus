# Commit 21 Social Posts

## Facebook
Commit 21 complete for Naija Transport Route & Fare Finder.

Frontend MVP view is now active:
- route search and selection
- route detail with ordered stops
- live fare estimate panel connected to backend

This is the first full user-facing route + fare flow.

## LinkedIn
Commit 21 shipped: Phase 2 Frontend MVP View.

Completed in this commit:
- Built route search and route selection UI (`frontend/src/App.tsx`)
- Added RouteView component with route metadata + ordered stops (`frontend/src/components/RouteView.tsx`)
- Added FareEstimate component with:
  - `time` and `traffic` controls
  - call to `GET /api/v1/fare/estimate`
  - fare breakdown + confidence display
- Added typed frontend API layer (`frontend/src/lib/api.ts`)
- Added shared transport/fare types (`frontend/src/types.ts`)

Validation:
- frontend production build passes
- backend endpoints already integrated into this flow

## Twitter
Commit 21 complete.

Frontend now supports search -> select route -> view stops -> estimate fare.
Fare panel calls `/api/v1/fare/estimate` with time + traffic controls and shows breakdown/confidence. #reactjs #typescript #nodejs #mongodb
