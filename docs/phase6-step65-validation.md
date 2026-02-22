# Phase 6 Step 6.5 Validation

Date: 2026-02-22
Scope: Production CORS allowlist hardening (HTTP + Socket.IO path alignment)

## Local Validation

Commands:
- `npm --prefix backend run test`
- `npm --prefix backend run build`

Result:
- Passed (`10` test suites, `69` tests total)
- TypeScript backend build passed

## Production Validation

Backend:
- `https://naija-bus-backend.onrender.com`

Configured allowlist:
- `https://naijatransport.vercel.app`
- `https://ultima-pi.vercel.app`
- `https://ultima.vercel.app`

Preflight checks:
1. Allowed origin preflight
   - Request origin: `https://naijatransport.vercel.app`
   - Expected: CORS response includes allow-origin for requested origin
   - Result: pass

2. Disallowed origin preflight
   - Request origin: `https://evil.example`
   - Expected: no permissive allow-origin for disallowed origin
   - Result: pass

## Notes

- Backend now resolves origins from `CORS_ALLOWED_ORIGINS` (preferred) with fallback to `CORS_ORIGIN`.
- Wildcard `*` is rejected by startup guard.
- Production startup requires an explicit allowlist.
- Socket.IO namespace CORS matcher uses the same normalized allowlist logic.
