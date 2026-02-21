# Commit 9 Social Posts

## Facebook
Commit 9 complete for Naija Transport Route & Fare Finder.

JWT middleware is now active for protected backend routes.
We also added a protected profile endpoint to validate auth flow end-to-end.

Verified:
- no token -> 401
- valid token -> 200
- invalid token -> 401

## LinkedIn
Commit 9 shipped: protected-route security baseline.

Completed in this commit:
- Added `authMiddleware.ts` for bearer-token protection
- Added role-guard utility for upcoming admin endpoints
- Added Express request typing for authenticated user context
- Added protected `GET /auth/me` endpoint
- Verified runtime behavior for unauthorized, authorized, and invalid-token requests

Phase 1 Task 1.8 is complete.

## Twitter
Commit 9 ✅
JWT middleware added for protected routes.

Checks:
- `/auth/me` without token -> `401`
- `/auth/me` with valid token -> `200`
- `/auth/me` with bad token -> `401`

Next: `.env.example` + config docs. #nodejs #express #jwt
