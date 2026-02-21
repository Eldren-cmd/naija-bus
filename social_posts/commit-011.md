# Commit 11 Social Posts

## Facebook
Commit 11 complete for Naija Transport Route & Fare Finder.

We now have a full seed dataset and script for the five Lagos MVP corridors.

Added:
- `seed/initialRoutes.json`
- `scripts/seed.js`

Dry-run validation passed. Next is Step 11: run seed against Atlas and verify the routes in DB.

## LinkedIn
Commit 11 shipped: initial data seeding setup.

Completed in this commit:
- Added structured seed file for 5 target corridors
- Added reusable seed script to upsert routes and refresh stops
- Added dry-run mode for safe validation before DB writes
- Updated project docs with seed usage commands

Phase 1 Task 1.10 is complete.

## Twitter
Commit 11 ✅
Seed setup is done:
- `seed/initialRoutes.json` (5 Lagos corridors)
- `scripts/seed.js` (supports `--dry-run`)

Dry-run passed. Next: execute seed and verify Atlas has the 5 routes. #mongodb #nodejs
