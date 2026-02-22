# Engagement Guide Mapping

Audit date: 2026-02-22  
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
- Phase 4 engagement baseline is now implemented on top of trip recording/history:
  - trip upload now awards engagement points
  - trip streak and cumulative distance are tracked
  - badge unlocks are applied from trip/report milestones
  - level progression + airtime accrual are computed from engagement points
  - MyTrips now surfaces points/level progress, badges, and leaderboard preview

### Phase 5 (through Task 5.14)
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
- Added saved-routes empty-state UX for re-engagement:
  - explicit guidance copy for first-time savers
  - immediate CTA to save currently selected route
  - fallback CTA to browse full route list
- Added global trust fallback for unexpected UI failures:
  - root error boundary now presents recovery actions instead of blank-screen failure
  - fallback copy keeps user informed with safe reset path
- Added E2E verification for engagement-critical Phase 5 flows:
  - authenticated login path
  - saved-route retention action flow
  - incident report submission flow
- Added Phase 5 UAT acceptance verification and remediation:
  - verified repeat-use retention flow for saved routes
  - verified report loop remains intact after UX/performance changes
  - applied lazy-load/perf fix to reduce first-load friction on engagement surfaces

### Phase 6 (through Task 6.1)
- Deployment prerequisite setup completed:
  - Vercel project linked to repo
  - frontend environment keys configured on hosted project
- Engagement applicability for 6.1:
  - no direct feature-level engagement change in this task
  - enables production delivery path for engagement loops already built in phases 3–5
- Deferred to next step (`6.2`):
  - replace temporary `VITE_API_BASE` placeholder with real backend public URL after backend hosting is provisioned

## Future Compliance Plan

### Phase 6 and Beyond
- Twitter/X auto-feed bot
- Airtime rewards job automation + payout workflow hardening
- PWA offline/service worker support
- USSD fallback (post-launch scope)
- Referral rewards flow (post-launch or late Phase 5 if prioritized)

## Rule Going Forward

For every new task completion:
1. Check if an Engagement Guide item applies.
2. Implement it in-sequence when it matches scope.
3. If not in-scope for the active task, document the deferral explicitly in checkpoint/audit notes.
