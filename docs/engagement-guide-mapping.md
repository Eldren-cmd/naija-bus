# Engagement Guide Mapping

Audit date: 2026-02-21  
Reference: `NaijaTransport_EngagementGuide.docx`

## Implemented Foundations (Phase 1)

1. Role model support is in place:
- `user`
- `champion`
- `conductor`
- `admin`

2. Engagement-ready user fields are in place:
- `championRoutes`
- `reportCount`
- `streak`
- `lastReportDate`
- `airtimeEarned`
- `badges`
- `referralCode`
- `referredBy`
- `referralPaid`
- `conductorToken`
- `phone`
- `source`

## Retrospective Compliance (Completed Phases)

### Phase 1
- Engagement foundation requirements are satisfied at schema level.

### Phase 2
- No major engagement-specific features were required; focus was core route/fare MVP.

### Phase 3
- Community reporting loop is partially aligned:
  - fare reports and traffic reports are live
  - realtime visibility of reports is live
- Engagement guide bot-ingestion baseline now implemented:
  - bot-auth ingestion endpoint: `POST /api/v1/reports/bot` with `x-bot-token`
  - `whatsapp-web.js` listener accepts structured report commands and ingests as reports
- Remaining phase-3 engagement expansion (optional):
  - richer WhatsApp command grammar and moderation workflows

### Phase 4
- Trip recording and history improve retention signals but do not yet include rewards/gamification loops.

### Phase 5 (through Task 5.10)
- Added saved routes retention loop:
  - authenticated save/unsave route actions
  - saved routes surfaced directly on Home
- Added mobile usability hardening for engagement-critical surfaces:
  - report interaction controls
  - saved-routes interaction flow on smaller screens
- Added loading-state trust/retention UX for frequent actions:
  - route discovery surfaces now show skeleton placeholders during load
  - saved-routes panel and trip-history list now show skeleton placeholders
  - fare insight retrieval now shows skeleton placeholder before first estimate resolves

## Future Compliance Plan

### Remaining Phase 5
- `5.11`: empty saved-routes UX should include clear call-to-action copy.
- `5.12`: global error boundary should preserve trust with clear recovery messaging.
- `5.13`: E2E flows should include auth + save route + report actions.
- `5.14`: UAT should include engagement acceptance checks (repeat-use loop and report loop).

### Phase 6 and Beyond
- Twitter/X auto-feed bot
- Airtime rewards job completion
- PWA offline/service worker support
- USSD fallback (post-launch scope)
- Referral rewards flow (post-launch or late Phase 5 if prioritized)

## Rule Going Forward

For every new task completion:
1. Check if an Engagement Guide item applies.
2. Implement it in-sequence when it matches scope.
3. If not in-scope for the active task, document the deferral explicitly in checkpoint/audit notes.
