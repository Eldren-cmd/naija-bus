# Commit 7 Social Posts

## Facebook
Commit 7 complete for Naija Transport Route & Fare Finder.

Authentication is now live in the backend with bcrypt password hashing and JWT issuance:
- `POST /auth/register`
- `POST /auth/login`

This closes another core foundation milestone and prepares us for protected routes next.

## LinkedIn
Commit 7 shipped: auth backend milestone.

Completed in this commit:
- Added bcrypt + JWT auth flow
- Added register and login endpoints
- Added token signing helper
- Verified behavior end-to-end:
  - register -> 201 + token
  - login -> 200 + token
  - duplicate register -> 409
  - wrong password -> 401

Phase 1 Task 1.7 is complete.

## Twitter
Commit 7 ✅
Auth endpoints are live:
- `POST /auth/register` (bcrypt hash + JWT)
- `POST /auth/login` (JWT on valid creds)

Verified statuses: `201`, `200`, `409`, `401`.
Next: JWT middleware for protected routes. #nodejs #express #jwt #mongodb
