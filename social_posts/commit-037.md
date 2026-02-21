# Commit 37 Social Posts

## Facebook
Commit 37 complete for Naija Transport Route & Fare Finder.

Frontend search got a major upgrade:
- Added debounced typeahead search
- Suggestions now include both routes and stops
- Selecting a suggestion jumps directly into the route flow

## LinkedIn
Commit 37 shipped: DevPlan Task 2.11 (debounced `SearchInput` typeahead).

Completed in this commit:
- Added `SearchInput` component (`frontend/src/components/SearchInput.tsx`)
- Added debounced calls to `GET /api/v1/search`
- Grouped suggestions by:
  - Routes
  - Stops
- Wired suggestion selection into main app route selection (`frontend/src/App.tsx`)
- Added search API client method (`frontend/src/lib/api.ts`)
- Added search result types (`frontend/src/types.ts`)
- Added search focus ring/dropdown styles (`frontend/src/App.css`)
- Updated strict tracking docs and audits

Validation:
- frontend lint passed
- frontend build passed

## Twitter
Commit 37 complete.

Task 2.11 shipped: debounced typeahead `SearchInput` now queries `GET /search` and returns both route + stop suggestions for faster route discovery. #reactjs #typescript #ux #api
