# Phase 3 Task 3.13 Validation

Date: 2026-02-21  
Environment: local (`http://localhost:5000`, MongoDB connected)

## Objective

Validate two-browser realtime marker flow for `report:created` events using socket viewport subscriptions.

## Method

Executed automated check script:

```bash
node scripts/phase3-step313-realtime-check.mjs
```

Script location:
- `frontend/scripts/phase3-step313-realtime-check.mjs`

Flow performed by script:
1. Health check (`GET /api/v1/health`)
2. Route selection (`GET /api/v1/routes?q=Ojota`, then route detail fetch)
3. User registration to obtain JWT (`POST /api/v1/auth/register`)
4. Connect three socket clients to `/reports`:
   - Browser A: subscribed to route viewport bbox
   - Browser B: subscribed to same route viewport bbox
   - Outside client: subscribed to non-overlapping bbox
5. Submit incident report (`POST /api/v1/reports`)
6. Assert realtime event delivery:
   - Browser A receives `report:created`
   - Browser B receives `report:created`
   - Outside client does not receive the event

## Result

Pass.

Observed output summary:

```json
{
  "expected": {
    "browserAReceived": true,
    "browserBReceived": true,
    "outsideReceived": false
  },
  "actual": {
    "browserAReceived": true,
    "browserBReceived": true,
    "outsideReceived": false,
    "browserAEventCount": 1,
    "browserBEventCount": 1,
    "outsideEventCount": 0
  },
  "pass": true
}
```

Conclusion: Task 3.13 realtime marker demo criteria are satisfied.
