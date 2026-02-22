# Commit 75 Social Posts

## Facebook
Commit 75 complete for Naija Transport Route & Fare Finder.

Major UX productization update shipped:
- New public homepage at `/` with a clear search-first flow.
- Route Finder moved to `/map` for cleaner user journey.
- Startup "Network Error" behavior reduced by waiting for explicit search submit.

## LinkedIn
Commit 75 shipped: Homepage integration + route-finder UX hardening.

Completed in this commit:
- Added a conversion-focused landing page (`frontend/src/pages/Home.tsx`) with:
  - minimal nav
  - hero route search
  - feature highlights
  - "How it works" section
  - branded footer
- Updated routing:
  - `/` -> Home
  - `/map` -> Route Finder app
  - `/search` alias retained for search flow
  - `/route/:routeId` preserved
- Improved Route Finder behavior:
  - removed internal "Phase 2 Core MVP" language from user-facing surface
  - route list API no longer auto-fires on initial load without user search
- Updated production branding:
  - title: `Naija Transport — Lagos Route & Fare Finder`
  - meta description for search/snippet quality
  - custom favicon (`frontend/public/favicon.svg`)
- Deployment/domain polish:
  - production redeployed on Vercel
  - readable alias assigned: `https://naijatransport.vercel.app`
- Updated compliance tracking:
  - `docs/step-checkpoints.md`
  - `docs/design-guide-audit.md`
  - `docs/engagement-guide-mapping.md`

## Twitter
Commit 75 complete.

New homepage is live, Route Finder now sits at `/map`, startup search behavior is cleaner, and branding metadata/favicon are polished. Alias set to `naijatransport.vercel.app`. #react #vercel #ux #product
