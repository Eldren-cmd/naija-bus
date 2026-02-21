import { isValidObjectId } from "mongoose";
import { estimateFare, TimeBand, TrafficLevel } from "../lib/fareEngine";
import { Fare, Route } from "../models";

const VALID_TRAFFIC_LEVELS: readonly TrafficLevel[] = ["low", "medium", "high"];
const CROWDSOURCE_WINDOW_MINUTES = 120;
const CROWDSOURCE_REPORT_LIMIT = 20;

export class FareServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "FareServiceError";
    this.statusCode = statusCode;
  }
}

export type EstimateRouteFareInput = {
  routeId: string;
  time?: string;
  trafficLevel?: string;
};

export type EstimateRouteFareResult = {
  routeId: string;
  routeName: string;
  origin: string;
  destination: string;
  currency: "NGN";
  confidence: number;
  trafficLevel: TrafficLevel;
  timeBand: TimeBand;
  baseFare: number;
  trafficMultiplier: number;
  timeMultiplier: number;
  ruleBasedFare: number;
  estimatedFare: number;
  recentReportsCount: number;
  crowdsourcedAverageFare: number | null;
  crowdsourcedWeightApplied: number;
  computedAt: string;
};

const parseClockTime = (value: string): number | null => {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours * 60 + minutes;
};

const parseIsoLikeTime = (value: string): number | null => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.getHours() * 60 + date.getMinutes();
};

const roundToNearestTen = (value: number): number => Math.round(value / 10) * 10;

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const average = (values: number[]): number =>
  values.reduce((sum, current) => sum + current, 0) / values.length;

export const resolveTimeBand = (time?: string): TimeBand => {
  let totalMinutes: number;

  if (!time || !time.trim()) {
    const now = new Date();
    totalMinutes = now.getHours() * 60 + now.getMinutes();
  } else {
    const asClock = parseClockTime(time);
    const asDate = asClock ?? parseIsoLikeTime(time);
    if (asDate === null) {
      throw new FareServiceError("time must be a valid HH:mm or ISO datetime string", 400);
    }
    totalMinutes = asDate;
  }

  const isMorningRush = totalMinutes >= 390 && totalMinutes <= 600; // 06:30-10:00
  const isEveningRush = totalMinutes >= 960 && totalMinutes <= 1230; // 16:00-20:30
  if (isMorningRush || isEveningRush) return "rush_hour";

  const isOffPeak = totalMinutes < 360 || totalMinutes >= 1320; // before 06:00 or from 22:00
  if (isOffPeak) return "off_peak";

  return "normal";
};

export const resolveTrafficLevel = (trafficLevel?: string): TrafficLevel => {
  if (!trafficLevel || !trafficLevel.trim()) return "medium";
  const normalized = trafficLevel.trim().toLowerCase();
  if (!VALID_TRAFFIC_LEVELS.includes(normalized as TrafficLevel)) {
    throw new FareServiceError("trafficLevel must be one of: low, medium, high", 400);
  }
  return normalized as TrafficLevel;
};

export const estimateRouteFare = async (
  input: EstimateRouteFareInput,
): Promise<EstimateRouteFareResult> => {
  if (!input.routeId || !isValidObjectId(input.routeId)) {
    throw new FareServiceError("invalid routeId", 400);
  }

  const route = await Route.findOne({
    _id: input.routeId,
    isActive: true,
  })
    .select("name origin destination baseFare confidenceScore")
    .lean();

  if (!route) {
    throw new FareServiceError("route not found", 404);
  }

  const trafficLevel = resolveTrafficLevel(input.trafficLevel);
  const timeBand = resolveTimeBand(input.time);
  const breakdown = estimateFare({
    baseFare: route.baseFare,
    trafficLevel,
    timeBand,
  });

  const recentCutoff = new Date(Date.now() - CROWDSOURCE_WINDOW_MINUTES * 60 * 1000);
  const recentReports = (await Fare.find({
    routeId: route._id,
    source: { $in: ["user_report", "admin_update"] },
    createdAt: { $gte: recentCutoff },
    amount: { $gt: 0 },
  })
    .sort({ createdAt: -1 })
    .limit(CROWDSOURCE_REPORT_LIMIT)
    .select("amount")
    .lean()) as Array<{ amount: number }>;

  const recentAmounts = recentReports.map((report) => Number(report.amount)).filter(Number.isFinite);
  const recentReportsCount = recentAmounts.length;
  const crowdsourcedAverageFare = recentReportsCount > 0 ? roundToNearestTen(average(recentAmounts)) : null;
  const crowdsourcedWeightApplied =
    recentReportsCount > 0 ? clamp(0.15 + recentReportsCount * 0.05, 0.15, 0.5) : 0;

  const ruleBasedFare = breakdown.estimatedFare;
  const blendedEstimate =
    crowdsourcedAverageFare === null
      ? ruleBasedFare
      : roundToNearestTen(ruleBasedFare * (1 - crowdsourcedWeightApplied) + crowdsourcedAverageFare * crowdsourcedWeightApplied);

  const confidenceBoost = recentReportsCount > 0 ? Math.min(0.2, recentReportsCount * 0.02) : 0;
  const confidence = clamp(route.confidenceScore + confidenceBoost, 0, 0.95);

  return {
    routeId: String(route._id),
    routeName: route.name,
    origin: route.origin,
    destination: route.destination,
    currency: "NGN",
    confidence,
    trafficLevel,
    timeBand,
    baseFare: breakdown.baseFare,
    trafficMultiplier: breakdown.trafficMultiplier,
    timeMultiplier: breakdown.timeMultiplier,
    ruleBasedFare,
    estimatedFare: blendedEstimate,
    recentReportsCount,
    crowdsourcedAverageFare,
    crowdsourcedWeightApplied,
    computedAt: new Date().toISOString(),
  };
};
