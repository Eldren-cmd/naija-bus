# DevPlan Audit (Phase 6)

Audit date: 2026-02-22  
Reference: `NaijaTransport_DevPlan.docx`  
Scope: Task-by-task check from `6.1` to `6.15`.

Status labels:
- `complete`: implemented and verified in code/platform checks
- `partial`: implemented with differences from DevPlan
- `missing`: not implemented yet

Cross-guide enforcement (mandatory):
- `NaijaTransport_DesignGuide.docx` must be checked for user-facing impact on each step.
- `NaijaTransport_EngagementGuide.docx` must be checked for retention/reporting-loop impact on each step.
- A task remains `complete` only when DevPlan acceptance and cross-guide applicability are documented.

| Task | Status | Notes |
| --- | --- | --- |
| 6.1 | complete | Vercel project linked to GitHub repo and frontend env vars added on Vercel (`VITE_MAPBOX_KEY`, `VITE_API_BASE`) for `production`, `preview`, and `development`. `VITE_API_BASE` is temporarily set to `https://replace-with-backend-url.example.com` and will be updated in `6.2` once backend URL is provisioned. |
| 6.2 | complete | Render web service created (`naija-bus-backend`) and linked to private repo with `backend/` root; backend env vars set; Vercel `VITE_API_BASE` updated to Render URL; public health endpoint now returns `{\"status\":\"ok\",\"database\":\"connected\"}`. |
| 6.3 | complete | Production Atlas cluster `naija-transport-prod` is provisioned and backup policy is active (`Daily Snapshot` every `24 Hours`, `Retention Time: 8 Days`, `Snapshot Time: 03:29 GMT+1`). Snapshot pipeline is scheduled and can also be triggered manually via `Take Snapshot Now`. |
| 6.4 | missing | Pending: seed production DB and verify on live frontend. |
| 6.5 | missing | Pending: production CORS allowlist hardening. |
| 6.6 | missing | Pending: HTTPS/HSTS/cookie security hardening. |
| 6.7 | missing | Pending: CI workflow for lint/test/build on push/PR. |
| 6.8 | missing | Pending: CD workflow for frontend deploy on `main`. |
| 6.9 | missing | Pending: CD workflow for backend deploy hook on `main`. |
| 6.10 | missing | Pending: Sentry integration and capture validation. |
| 6.11 | missing | Pending: structured server logging + sink integration. |
| 6.12 | missing | Pending: Mapbox billing alerts and quota guardrails. |
| 6.13 | missing | Pending: uptime monitoring of `/api/v1/health`. |
| 6.14 | missing | Pending: production security audit checks. |
| 6.15 | missing | Pending: final production README/demo packaging. |

## Recovery Order (Strict DevPlan Alignment)

1. Continue with `6.4` next.
2. Keep phase-6 tasks in strict sequence with step-level validation and compliance notes.
