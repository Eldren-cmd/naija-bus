# Commit 29 Social Posts

## Facebook
Commit 29 complete for Naija Transport Route & Fare Finder.

Fare estimates now use recent commuter-submitted fare reports:
- backend still computes rule-based fare
- then blends with recent crowdsourced reports for a more realistic estimate

## LinkedIn
Commit 29 shipped: Phase 3 Task 3.4.

Completed in this commit:
- Updated fare estimate service (`backend/src/services/fareService.ts`) to incorporate recent fare reports
- Added recency window query (last 2 hours) on fares collection
- Implemented blended estimate model:
  - rule-based multiplier output
  - crowdsourced average influence with bounded weight
- Added additional estimate metadata:
  - `ruleBasedFare`
  - `recentReportsCount`
  - `crowdsourcedAverageFare`
  - `crowdsourcedWeightApplied`
- Added dedicated test coverage:
  - `backend/tests/fareServiceCrowdsource.test.ts`

Validation:
- backend build passed
- backend tests passed (`28/28`)
- live check confirmed adjusted estimate after new fare report submission

## Twitter
Commit 29 complete.

`GET /fare/estimate` now blends rule-based pricing with recent crowdsourced fare data (2-hour window), with added transparency fields in response. #nodejs #mongodb #realtime #backend
