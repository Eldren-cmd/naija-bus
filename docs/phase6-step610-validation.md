# Phase 6 Step 6.10 Validation

Date: 2026-02-22  
Scope: Sentry backend integration and capture validation flow

## Local Validation

Commands:
- `npm --prefix backend run test`
- `npm --prefix backend run build`
- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`

Result:
- Passed

## Implementation Validation

Files verified:
- `backend/src/config/observability.ts`
  - DSN-based Sentry initialization
  - capture helper with tags/extras
  - flush helper for capture confirmation
- `backend/src/server.ts`
  - startup observability initialization
  - process-level hooks for unhandled promise rejections and uncaught exceptions
  - JSON `>=500` response mirror capture
  - token-gated validation endpoint:
    - `POST /api/v1/observability/sentry-test`
    - `POST /observability/sentry-test`
- `backend/.env.example`
  - `SENTRY_DSN`
  - `SENTRY_ENVIRONMENT`
  - `SENTRY_TRACES_SAMPLE_RATE`
  - `SENTRY_CAPTURE_TEST_TOKEN`
- `README.md`
  - backend environment documentation for sentry keys

## Live Capture Validation Procedure

Run against production backend:

```bash
curl -X POST "https://naija-bus-backend.onrender.com/api/v1/observability/sentry-test" \
  -H "x-sentry-test-token: <SENTRY_CAPTURE_TEST_TOKEN>"
```

Expected:
- HTTP `202`
- response includes:
  - `ok: true`
  - `message: "sentry test event captured"`

Then verify in Sentry:
- open project issues/events and confirm the test event appears with operation tag:
  - `manual_sentry_capture_validation`

## Notes

- Validation endpoint is intentionally token-gated to prevent unauthenticated synthetic error spam.
- Production Sentry enablement requires Render env:
  - `SENTRY_DSN`
  - `SENTRY_ENVIRONMENT=production`
  - `SENTRY_CAPTURE_TEST_TOKEN`
