# Commit 95 Social Posts

## Facebook
Commit 95 complete.

Action-level auth guard is now implemented:
- discovery stays open for everyone
- protected actions are now explicitly gated
- button labels now adapt to auth state (e.g. Login to Save, Login to Submit Fare)
- users get clearer guidance exactly at the action point

## LinkedIn
Commit 95 shipped: action-level auth guard integration.

Completed in this commit:
- Added reusable guard hook:
  - `frontend/src/hooks/useAuthGuard.ts`
  - centralizes token checks, blocked-action messaging, and auth-aware action labels
- Applied guard in Route Finder save flow:
  - `frontend/src/App.tsx`
  - route save action protected with contextual labels:
    - authenticated: `Save`
    - guest: `Login to Save`
- Applied guard in Fare Report action flow:
  - `frontend/src/components/ReportFarePanel.tsx`
  - submit action label now adapts by auth state
- Applied guard in Trip Upload action flow:
  - `frontend/src/components/TripRecorder.tsx`
  - upload action label now adapts by auth state
- Applied guard in Traffic Report action flow:
  - `frontend/src/components/TrafficReportModal.tsx`
  - open/report actions now guard with clear sign-in prompts

Validation:
- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`
- `npm --prefix backend run test`
- `npm --prefix backend run build`

## Twitter
Commit 95 done.

Action auth guard is now live:
- public discovery stays open
- protected actions are gated at point-of-use
- action labels now reflect auth state (Login to Save/Submit/Upload/Report)

#NaijaTransport #UX #Auth #React #Frontend
