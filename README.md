# Naija Transport Route & Fare Finder

This repository is being built strictly from:
- `NaijaTransport_DesignGuide.docx`
- `NaijaTransport_DevPlan.docx`
- `NaijaTransport_EngagementGuide.docx`

## Current Progress
- [x] Phase 1 / Task 1.1: Monorepo skeleton created (`frontend/`, `backend/`, `seed/`, `scripts/`)
- [x] Phase 1 / Task 1.2: Frontend initialized (Vite + React + TypeScript + Tailwind CSS)
- [x] Phase 1 / Task 1.3: Backend initialized (Node + Express + TypeScript + ts-node-dev)
- [x] Phase 1 / Task 1.4: MongoDB Atlas connection tested from backend
- [x] Phase 1 / Task 1.5: Created 6 Mongoose models (Route, Stop, Fare, Report, User, TripRecord)
- [x] Phase 1 / Task 1.6: Created 2dsphere + TTL indexes for route/stop/report collections
- [x] Phase 1 / Task 1.7: Implemented auth routes (`POST /auth/register`, `POST /auth/login`) with bcrypt + JWT
- [x] Phase 1 / Task 1.8: Added JWT auth middleware for protected routes
- [x] Social post archive initialized (`social_posts/`)
- [ ] Remaining Phase 1 tasks (1.9 to 1.12)

## Working Rules for This Build
- Move step-by-step in task order.
- Pause after each completed step and confirm before moving to the next.
- Commit frequently.
- Store a Facebook/LinkedIn/Twitter post after each commit in `social_posts/`.
- Keep secrets out of git.

## Note on GitHub Visibility
The project uses a **private** GitHub repository at `origin` with `main` pushed.
