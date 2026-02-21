# Engagement Guide Mapping (Pre-Step 8 Reconciliation)

Source added to strict references:
- `NaijaTransport_EngagementGuide.docx`

## Implemented Now (because they belong in foundation/model layer)

1. User role expansion for engagement actors:
- `user`
- `champion`
- `conductor`
- `admin`

2. User engagement data fields (for later Phase 3/5/6 features):
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

Rationale:
- These are schema foundations referenced by multiple engagement strategies.
- Adding them now avoids later migration friction and keeps Step 1 model work complete.

## Not Implemented Yet (scheduled by development plan and engagement guide phase mapping)

1. WhatsApp bot integration (Phase 3)
2. Bot auth middleware + bot-origin report ingestion (Phase 3)
3. Quick-report conductor UI + conductor links (Phase 5)
4. Badge award engine + streak cron + leaderboard endpoint (Phase 5)
5. Airtime rewards job (Phase 5/6)
6. Twitter/X auto-feed bot (Phase 6)
7. Referral rewards flow (Post-launch v2 or late Phase 5 depending scope)
8. PWA offline mode/service worker (Phase 6)
9. USSD fallback (Post-launch v2)

## Pre-Step 8 Status

Foundation Steps 1–7 remain in order and complete.
Proceeding next with Step 8 (`authMiddleware.ts`) after this reconciliation checkpoint.
