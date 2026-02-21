# Commit 63 Social Posts

## Facebook
Commit 63 complete for Naija Transport Route & Fare Finder.

We closed older guide gaps before moving ahead:
- Added secure bot-ingestion endpoint for automated incident reports.
- Added a `whatsapp-web.js` bot listener for WhatsApp message report ingestion.
- Aligned MyTrips map style with RouteView for design consistency.

## LinkedIn
Commit 63 shipped: historical Design + Engagement gap remediation.

Completed in this commit:
- Backend bot ingestion:
  - Added `POST /api/v1/reports/bot` and `/reports/bot`
  - Added `x-bot-token` guard and bot user attribution
  - Reused existing incident validation and realtime emit flow
- WhatsApp bot:
  - Added optional `whatsapp-web.js` listener service with QR login
  - Added sender allowlist support and structured `report ...` command parsing
- Design parity:
  - Updated MyTrips replay map style to `navigation-night-v1`
- Quality:
  - Added integration tests for bot-ingestion endpoint
  - Backend and frontend test/build/lint checks passed

## Twitter
Commit 63 complete.

Backfilled missed guide items: secure bot report ingestion + whatsapp-web.js listener + MyTrips map style parity. #nodejs #react #whatsapp #productengineering
