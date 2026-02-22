# Commit 91 Social Posts

## Facebook
Commit 91 complete.

Route Finder shell and search UX are now upgraded:
- replaced the old top card structure with a dedicated hero strip for route discovery
- added a focused search experience with quick route pills
- removed prominent dev/beta-style framing from the main search flow
- preserved submit-only search behavior (no startup auto-search)

## LinkedIn
Commit 91 shipped: Route Finder shell + search UX refresh.

Completed in this commit:
- Added new search hero component:
  - `frontend/src/components/SearchBar.tsx`
- Refactored Route Finder shell in:
  - `frontend/src/App.tsx`
  - integrated hero search component into page flow
  - removed inline nav coupling in page header
  - retained explicit submit-driven search lifecycle
- Added route-finder hero and search styles in:
  - `frontend/src/App.css`
  - responsive hero strip
  - branded search input/button states
  - quick-route pill row with mobile horizontal scroll support

Validation:
- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`
- `npm --prefix backend run test`
- `npm --prefix backend run build`

## Twitter
Commit 91 done.

Route Finder now has a cleaner hero search UX:
- dedicated search shell
- quick route pills
- submit-only search preserved
- less internal/dev-looking page framing

#NaijaTransport #UIUX #React #Frontend #ProductDesign
