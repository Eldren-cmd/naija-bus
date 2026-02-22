# Phase 6 Task 6.1 Validation

Date: 2026-02-22  
Scope: Vercel project linkage + required frontend environment variables.

## Executed Commands

1. `vercel --version`
2. `vercel ls --yes`
3. `vercel env add VITE_MAPBOX_KEY <environment>`
4. `vercel env add VITE_API_BASE <environment>`
5. `vercel env ls`
6. `npm --prefix frontend run build`

## Result

- Vercel project linked: `eldrens-projects/ultima`
- GitHub repo connected: `Eldren-cmd/naija-bus`
- Environment variables present in all targets (`production`, `preview`, `development`):
  - `VITE_MAPBOX_KEY`
  - `VITE_API_BASE`
- Frontend build check passed after configuration.

## Important Note

- `VITE_API_BASE` is currently set to a temporary placeholder:
  - `https://replace-with-backend-url.example.com`
- It must be replaced in Task `6.2` after backend deployment URL is created.
