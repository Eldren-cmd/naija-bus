# Design Guide Audit (Current UI)

Audit date: 2026-02-22  
Reference: `NaijaTransport_DesignGuide.docx`

## Already Implemented

- Font family stack loaded in `frontend/index.html`:
  - Clash Display
  - DM Sans
  - JetBrains Mono
- Font variables configured in `frontend/src/index.css`.
- Warm cream background and amber/navy palette direction already in place.
- Animated fare number transition implemented in `frontend/src/components/FareEstimate.tsx`.
- RouteView map style switched to `mapbox://styles/mapbox/navigation-night-v1`.
- Route polyline now includes glow + stronger layered line styling in `frontend/src/components/RouteMap.tsx`.
- Route list cards and saved-route cards now include hover lift + shadow motion in `frontend/src/App.css`.
- MyTrips replay map style aligned to `mapbox://styles/mapbox/navigation-night-v1` in `frontend/src/components/MyTripMap.tsx`.
- Mobile responsive pass completed for Home, RouteView, and MyTrips in `frontend/src/App.css` (1020/768/560 breakpoints).
- Loading skeleton states added across Route Finder, RouteView, Fare Estimate, Search typeahead, and MyTrips to reduce abrupt layout shifts.
- MyTrips engagement panel added with styled level/progress, badges, and leaderboard card components aligned to existing palette and typography.
- Saved-routes empty state card now includes clear guidance copy and action buttons, improving first-time usability.
- Global error fallback screen now matches existing typography/card styling and keeps primary/secondary action hierarchy consistent.
- Playwright E2E coverage added for core Phase 5 UX paths to reduce regressions during ongoing polish.
- Phase 5 UAT remediation applied for perceived performance:
  - `RouteMap`, `MyTripMap`, and `AdminPanel` now load lazily
  - Vite build now uses manual chunk splitting to reduce initial app payload
- Phase 6 task `6.1` deployment prep completed:
  - hosted frontend env configuration now includes map key for production map rendering parity
- Phase 6 task `6.2` backend deployment completed:
  - live backend endpoint now supports design-level flows in non-local environments (route detail, fare estimate, reporting surfaces)
- Phase 6 task `6.3` production backup baseline completed:
  - Atlas backup policy for production data is active, supporting reliability of user-facing route/fare/report history surfaces
- Phase 6 task `6.4` production seed + hosted SPA reliability completed:
  - Vercel build/output config now serves the frontend app correctly from monorepo root
  - SPA route refresh rewrite now preserves route-detail page access after direct URL reloads
- Phase 6 task `6.5` backend CORS allowlist hardening completed:
  - explicit allowlist matching now protects HTTP and realtime channels from unintended cross-origin access
  - production startup now fails fast when allowlist is missing, reducing silent misconfiguration risk
- Phase 6 task `6.6` transport and cookie security hardening completed:
  - backend now supports production HTTPS redirect + HSTS headers with proxy-aware secure detection
  - refresh-token cookie policy now uses production-safe settings (`Secure`, `HttpOnly`, `SameSite=None`) for hosted frontend/backend split deployments
- Phase 6 task `6.7` CI quality-gate baseline completed:
  - GitHub Actions workflow now enforces frontend lint/build and backend test/build on `push` and `pull_request`
  - reduces risk of design/UI regressions being merged without passing baseline checks
- Phase 6 task `6.8` frontend CD baseline completed:
  - GitHub Actions workflow now deploys frontend to Vercel production on `main`
  - automated deploy flow reduces manual release drift against approved UI/design states
- Productization pass completed for public-first UX:
  - added conversion-focused homepage at `/` with clear hero search, feature highlights, and "How it works" sections
  - Route Finder moved to `/map` to separate marketing surface from operational app surface
  - removed internal phase-language labels from user-facing pages and replaced with product-safe copy
  - updated browser metadata (`title`, `description`) and favicon branding for production polish
- Auth and route-search UX hardening pass completed:
  - login/signup pages now use branded high-contrast shell + structured card hierarchy
  - auth inputs now have explicit visible borders, focus states, and loading feedback
  - removed internal implementation copy from account pages
  - route search now triggers by explicit submit only (no typeahead API side-effect on mount/value change)
  - route search action button now uses brand-orange styling for visual identity continuity

## High-Impact Gaps To Implement Next

1. Search and card interaction polish
- Search focus ring + typeahead dropdown behavior implemented.
- Route cards apply hover lift + shadow motion.

2. Feedback interactions
- Guide-recommended toast feedback for submissions is implemented.

3. Realtime map signals
- Severity-based report marker colors are present on the map.
- Live marker updates over Socket.IO are implemented.

## Implementation Note

Remaining design-only polish still open:
- No unresolved high-impact design gaps currently tracked for completed phases.
