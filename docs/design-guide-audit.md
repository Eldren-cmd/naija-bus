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

## High-Impact Gaps To Implement Next

1. Route map visual style
- RouteView map still uses `streets-v12`; guide recommends `navigation-night-v1` for RouteView.
- Route glow + stronger line styling not yet implemented.

2. Search and card interaction polish
- Search focus ring + typeahead dropdown behavior now implemented.
- Route cards do not yet apply the recommended hover lift + shadow motion.

3. Feedback interactions
- Guide recommends toast feedback for submissions; current report success uses inline message text.

4. Realtime map signals
- Severity-based report marker colors are now present on the map.
- Live marker updates over Socket.IO are now implemented.

## Implementation Note

These design items align directly with pending DevPlan tasks:
- `3.11`
