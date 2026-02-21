# Design Guide Audit (Current UI)

Audit date: 2026-02-21  
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
