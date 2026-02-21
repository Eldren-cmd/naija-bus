# Commit 61 Social Posts

## Facebook
Commit 61 complete for Naija Transport Route & Fare Finder.

Saved routes is now active:
- Users can save and remove routes from Home.
- Saved routes now appear in a dedicated sidebar panel.
- Backend endpoints for saved routes are secured with authentication.

## LinkedIn
Commit 61 shipped: DevPlan Task 5.8 (Saved Routes endpoint + Home integration).

Completed in this commit:
- Backend:
  - Added authenticated saved-routes endpoints in `backend/src/server.ts`:
    - `GET /api/v1/routes/saved`
    - `POST /api/v1/routes/saved`
    - `DELETE /api/v1/routes/saved/:routeId`
  - Add/remove logic uses `$addToSet` and `$pull` on user `savedRoutes`
  - Added integration tests in `backend/tests/phase2.integration.test.ts`
- Frontend:
  - Added API helpers in `frontend/src/lib/api.ts`:
    - `getSavedRoutes`
    - `addSavedRoute`
    - `removeSavedRoute`
  - Integrated Home UI in `frontend/src/App.tsx`:
    - saved routes panel
    - save/unsave controls per route
    - quick navigation from saved route list
  - Added styling updates in `frontend/src/App.css`

## Twitter
Commit 61 complete.

Task 5.8 done: authenticated saved-routes API + Home save/unsave + saved routes panel integration. #react #express #typescript
