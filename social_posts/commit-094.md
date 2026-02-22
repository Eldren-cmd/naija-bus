# Commit 94 Social Posts

## Facebook
Commit 94 complete.

Resilience and feedback UX are now improved:
- upgraded toasts with stronger visual hierarchy, progress rail, and smoother motion
- added a global offline/online status banner
- added mobile pull-to-refresh behavior on Route Finder for quick data refresh

## LinkedIn
Commit 94 shipped: resilience + feedback UX layer.

Completed in this commit:
- Upgraded notifications:
  - `frontend/src/components/ToastStack.tsx`
  - tone icon badges, title + message structure, dismiss control polish, timed progress rail
- Added connectivity feedback component:
  - `frontend/src/components/OfflineBanner.tsx`
  - real-time online/offline event handling with recovery pulse
- Added mobile refresh interaction hook:
  - `frontend/src/hooks/usePullToRefresh.ts`
  - pull threshold, release-to-refresh state, refresh animation states
- Integrated the new UX patterns:
  - `frontend/src/App.tsx`
  - offline banner mounted on Route Finder + My Trips
  - pull-to-refresh wired into Route Finder shell
  - refresh nonce added to route/saved-route/detail data loaders
- Added style system support:
  - `frontend/src/App.css`
  - offline banner visuals
  - pull-to-refresh indicator states
  - enhanced toast layout and motion
  - mobile-safe toast positioning above bottom nav

Validation:
- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`
- `npm --prefix backend run test`
- `npm --prefix backend run build`

## Twitter
Commit 94 done.

Feedback UX is stronger now:
- richer toast system
- online/offline live banner
- mobile pull-to-refresh in Route Finder

#NaijaTransport #UX #Frontend #React #Resilience
