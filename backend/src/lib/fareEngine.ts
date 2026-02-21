export type TrafficLevel = "low" | "medium" | "high";
export type TimeBand = "off_peak" | "normal" | "rush_hour";

export type FareEstimateInput = {
  baseFare: number;
  trafficLevel?: TrafficLevel;
  timeBand?: TimeBand;
};

export type FareEstimateBreakdown = {
  baseFare: number;
  trafficMultiplier: number;
  timeMultiplier: number;
  estimatedFare: number;
};

const trafficMultipliers: Record<TrafficLevel, number> = {
  low: 0.95,
  medium: 1,
  high: 1.2,
};

const timeMultipliers: Record<TimeBand, number> = {
  off_peak: 0.9,
  normal: 1,
  rush_hour: 1.15,
};

const roundToNearestTen = (value: number): number => Math.round(value / 10) * 10;

export const estimateFare = (input: FareEstimateInput): FareEstimateBreakdown => {
  if (!Number.isFinite(input.baseFare) || input.baseFare < 0) {
    throw new Error("baseFare must be a non-negative number");
  }

  const trafficLevel = input.trafficLevel ?? "medium";
  const timeBand = input.timeBand ?? "normal";

  const trafficMultiplier = trafficMultipliers[trafficLevel];
  const timeMultiplier = timeMultipliers[timeBand];

  const rawEstimate = input.baseFare * trafficMultiplier * timeMultiplier;
  const estimatedFare = roundToNearestTen(rawEstimate);

  return {
    baseFare: input.baseFare,
    trafficMultiplier,
    timeMultiplier,
    estimatedFare,
  };
};
