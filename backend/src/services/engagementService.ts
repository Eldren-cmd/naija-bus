import { User } from "../models";

const DAY_MS = 24 * 60 * 60 * 1000;
const POINTS_PER_LEVEL = 120;
const AIRTIME_PER_LEVEL = 25;

const TRIP_BASE_POINTS = 25;
const TRIP_DISTANCE_POINTS_PER_KM = 6;
const TRIP_DISTANCE_POINTS_CAP = 40;
const TRIP_LONG_RUN_BONUS = 8;

const INCIDENT_REPORT_POINTS = 10;
const FARE_REPORT_POINTS = 8;

export type EngagementSource = "trip" | "incident_report" | "fare_report";

type EngagementUserShape = {
  _id: unknown;
  fullName?: string;
  reportCount?: number;
  streak?: number;
  lastReportDate?: Date | string | null;
  tripStreak?: number;
  tripCount?: number;
  lastTripDate?: Date | string | null;
  totalDistanceMeters?: number;
  engagementPoints?: number;
  level?: number;
  airtimeEarned?: number;
  badges?: string[];
  save?: () => Promise<unknown>;
  createdAt?: string | Date;
};

export type EngagementSummary = {
  userId: string;
  points: number;
  level: number;
  nextLevelAtPoints: number;
  progressPercent: number;
  pointsToNextLevel: number;
  reportCount: number;
  reportStreak: number;
  tripCount: number;
  tripStreak: number;
  totalDistanceMeters: number;
  airtimeEarned: number;
  badges: string[];
};

export type EngagementLeaderboardEntry = {
  rank: number;
  userId: string;
  fullName: string;
  points: number;
  level: number;
  tripCount: number;
  reportCount: number;
  badgesCount: number;
};

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const dayKey = (value: Date): number =>
  Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());

const computeStreak = (currentStreak: number, previousDate: Date | null, now: Date): number => {
  if (!previousDate) return 1;
  const delta = Math.round((dayKey(now) - dayKey(previousDate)) / DAY_MS);
  if (delta <= 0) return Math.max(1, currentStreak);
  if (delta === 1) return currentStreak + 1;
  return 1;
};

const withBadge = (badges: string[], badge: string) => {
  if (!badges.includes(badge)) badges.push(badge);
};

const pointsToLevel = (points: number): number => Math.max(1, Math.floor(points / POINTS_PER_LEVEL) + 1);

const applyLevelAndAirtime = (user: EngagementUserShape) => {
  const points = Math.max(0, toNumber(user.engagementPoints, 0));
  const previousLevel = Math.max(1, toNumber(user.level, 1));
  const computedLevel = pointsToLevel(points);
  if (computedLevel > previousLevel) {
    const gain = computedLevel - previousLevel;
    user.airtimeEarned = Math.max(0, toNumber(user.airtimeEarned, 0) + gain * AIRTIME_PER_LEVEL);
  } else {
    user.airtimeEarned = Math.max(0, toNumber(user.airtimeEarned, 0));
  }
  user.level = computedLevel;
};

const toSummary = (user: EngagementUserShape): EngagementSummary => {
  const points = Math.max(0, toNumber(user.engagementPoints, 0));
  const level = Math.max(1, toNumber(user.level, 1));
  const previousLevelFloor = (level - 1) * POINTS_PER_LEVEL;
  const nextLevelAtPoints = level * POINTS_PER_LEVEL;
  const pointsIntoLevel = Math.max(0, points - previousLevelFloor);
  const progressPercent = Math.min(100, Math.round((pointsIntoLevel / POINTS_PER_LEVEL) * 100));

  return {
    userId: String(user._id),
    points,
    level,
    nextLevelAtPoints,
    progressPercent,
    pointsToNextLevel: Math.max(0, nextLevelAtPoints - points),
    reportCount: Math.max(0, toNumber(user.reportCount, 0)),
    reportStreak: Math.max(0, toNumber(user.streak, 0)),
    tripCount: Math.max(0, toNumber(user.tripCount, 0)),
    tripStreak: Math.max(0, toNumber(user.tripStreak, 0)),
    totalDistanceMeters: Math.max(0, toNumber(user.totalDistanceMeters, 0)),
    airtimeEarned: Math.max(0, toNumber(user.airtimeEarned, 0)),
    badges: Array.isArray(user.badges) ? user.badges.map((badge) => String(badge)) : [],
  };
};

const awardTripBadges = (user: EngagementUserShape) => {
  const badges = Array.isArray(user.badges) ? user.badges.map((badge) => String(badge)) : [];
  const tripCount = Math.max(0, toNumber(user.tripCount, 0));
  const tripStreak = Math.max(0, toNumber(user.tripStreak, 0));
  const totalDistanceMeters = Math.max(0, toNumber(user.totalDistanceMeters, 0));
  const points = Math.max(0, toNumber(user.engagementPoints, 0));

  if (tripCount >= 1) withBadge(badges, "first_trip");
  if (tripCount >= 10) withBadge(badges, "trip_ten");
  if (tripStreak >= 3) withBadge(badges, "trip_streak_3");
  if (tripStreak >= 7) withBadge(badges, "trip_streak_7");
  if (totalDistanceMeters >= 10_000) withBadge(badges, "distance_10km");
  if (points >= 500) withBadge(badges, "road_legend");

  user.badges = badges;
};

const awardReportBadges = (user: EngagementUserShape) => {
  const badges = Array.isArray(user.badges) ? user.badges.map((badge) => String(badge)) : [];
  const reportCount = Math.max(0, toNumber(user.reportCount, 0));
  const reportStreak = Math.max(0, toNumber(user.streak, 0));

  if (reportCount >= 1) withBadge(badges, "first_report");
  if (reportCount >= 10) withBadge(badges, "report_ten");
  if (reportStreak >= 3) withBadge(badges, "report_streak_3");

  user.badges = badges;
};

const tripPointsFor = (distanceMeters: number, checkpointsCount: number): number => {
  const distanceKm = Math.max(0, Math.round(distanceMeters / 1000));
  const distancePoints = Math.min(TRIP_DISTANCE_POINTS_CAP, distanceKm * TRIP_DISTANCE_POINTS_PER_KM);
  const longRunBonus = checkpointsCount >= 20 ? TRIP_LONG_RUN_BONUS : 0;
  return TRIP_BASE_POINTS + distancePoints + longRunBonus;
};

export const awardTripEngagement = async (input: {
  userId: string;
  distanceMeters: number;
  checkpointsCount: number;
  occurredAt?: Date;
}): Promise<{ pointsEarned: number; summary: EngagementSummary } | null> => {
  const user = (await User.findById(input.userId)) as EngagementUserShape | null;
  if (!user || typeof user.save !== "function") return null;

  const occurredAt = input.occurredAt || new Date();
  const pointsEarned = tripPointsFor(input.distanceMeters, input.checkpointsCount);

  user.tripCount = Math.max(0, toNumber(user.tripCount, 0) + 1);
  user.totalDistanceMeters = Math.max(0, toNumber(user.totalDistanceMeters, 0) + Math.round(input.distanceMeters));
  user.tripStreak = computeStreak(toNumber(user.tripStreak, 0), toDate(user.lastTripDate), occurredAt);
  user.lastTripDate = occurredAt;
  user.engagementPoints = Math.max(0, toNumber(user.engagementPoints, 0) + pointsEarned);

  awardTripBadges(user);
  applyLevelAndAirtime(user);
  await user.save();

  return {
    pointsEarned,
    summary: toSummary(user),
  };
};

export const awardReportEngagement = async (input: {
  userId: string;
  source: Exclude<EngagementSource, "trip">;
  occurredAt?: Date;
}): Promise<{ pointsEarned: number; summary: EngagementSummary } | null> => {
  const user = (await User.findById(input.userId)) as EngagementUserShape | null;
  if (!user || typeof user.save !== "function") return null;

  const occurredAt = input.occurredAt || new Date();
  const pointsEarned = input.source === "incident_report" ? INCIDENT_REPORT_POINTS : FARE_REPORT_POINTS;

  user.reportCount = Math.max(0, toNumber(user.reportCount, 0) + 1);
  user.streak = computeStreak(toNumber(user.streak, 0), toDate(user.lastReportDate), occurredAt);
  user.lastReportDate = occurredAt;
  user.engagementPoints = Math.max(0, toNumber(user.engagementPoints, 0) + pointsEarned);

  awardReportBadges(user);
  applyLevelAndAirtime(user);
  await user.save();

  return {
    pointsEarned,
    summary: toSummary(user),
  };
};

export const getEngagementSummaryByUserId = async (userId: string): Promise<EngagementSummary | null> => {
  const user = (await User.findById(userId)
    .select(
      "_id reportCount streak lastReportDate tripStreak tripCount lastTripDate totalDistanceMeters engagementPoints level airtimeEarned badges",
    )
    .lean()) as EngagementUserShape | null;

  if (!user) return null;
  return toSummary(user);
};

export const getEngagementLeaderboard = async (
  limit = 10,
): Promise<EngagementLeaderboardEntry[]> => {
  const safeLimit = Math.max(1, Math.min(50, Math.floor(limit)));
  const users = (await User.find({ isActive: true })
    .select("_id fullName engagementPoints level tripCount reportCount badges createdAt")
    .sort({ engagementPoints: -1, level: -1, tripCount: -1, reportCount: -1, createdAt: 1 })
    .limit(safeLimit)
    .lean()) as EngagementUserShape[];

  return users.map((user, index) => ({
    rank: index + 1,
    userId: String(user._id),
    fullName: user.fullName?.trim() || "Anonymous Rider",
    points: Math.max(0, toNumber(user.engagementPoints, 0)),
    level: Math.max(1, toNumber(user.level, 1)),
    tripCount: Math.max(0, toNumber(user.tripCount, 0)),
    reportCount: Math.max(0, toNumber(user.reportCount, 0)),
    badgesCount: Array.isArray(user.badges) ? user.badges.length : 0,
  }));
};
