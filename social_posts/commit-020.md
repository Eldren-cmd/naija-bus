# Commit 20 Social Posts

## Facebook
Commit 20 complete for Naija Transport Route & Fare Finder.

Fare estimate API is now live:
- `GET /api/v1/fare/estimate?routeId=&time=`

Users can now request route-based estimated fare with a clear breakdown.

## LinkedIn
Commit 20 shipped: Phase 2 Task 2.6.

Completed in this commit:
- Added fare estimate endpoint:
  - `GET /api/v1/fare/estimate`
  - alias: `GET /fare/estimate`
- Wired endpoint to the new fare service layer from Task 2.5
- Added query validation (`routeId` required)
- Added structured error mapping:
  - invalid input -> `400`
  - route not found -> `404`
  - unexpected error -> `500`

Response now includes:
- base fare
- traffic and time multipliers
- estimated fare
- confidence score
- computed timestamp

## Twitter
Commit 20 complete.

`GET /fare/estimate` is now implemented and wired to our fare service.
Supports `routeId` + optional `time/trafficLevel`, with clear 400/404 handling and full fare breakdown response. #nodejs #express #mongodb #typescript
