import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import { rateLimit } from "express-rate-limit";
import { createServer } from "http";
import { isValidObjectId } from "mongoose";
import { connectToDatabase, ensureCoreIndexes, getDatabaseStatus } from "./config/db";
import { Fare, Report, Route, Stop, TripRecord, User } from "./models";
import { authMiddleware, requireRoles } from "./middleware/authMiddleware";
import {
  emitFareReported,
  emitReportCreated,
  emitTripRecorded,
  initRealtimeServer,
} from "./realtime/reportsSocket";
import { authRouter } from "./routes/auth";
import { FareServiceError, estimateRouteFare } from "./services/fareService";
import {
  validateFareReportBody,
  validateIncidentReportBody,
  validateRouteCreateBody,
  validateStopCreateBody,
  validateRouteUpdateBody,
  validateTripCreateBody,
} from "./validation/requestSchemas";

dotenv.config();

export const app = express();
const port = Number(process.env.PORT || 5000);
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use("/auth", authRouter);
app.use("/api/v1/auth", authRouter);

app.get("/api/v1/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "backend",
    database: getDatabaseStatus(),
  });
});

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parsePositiveInteger = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const SEARCH_RATE_LIMIT_WINDOW_MS = parsePositiveInteger(
  process.env.SEARCH_RATE_LIMIT_WINDOW_MS,
  60_000,
);
const SEARCH_RATE_LIMIT_MAX = parsePositiveInteger(process.env.SEARCH_RATE_LIMIT_MAX, 60);
const ROUTES_RATE_LIMIT_WINDOW_MS = parsePositiveInteger(
  process.env.ROUTES_RATE_LIMIT_WINDOW_MS,
  60_000,
);
const ROUTES_RATE_LIMIT_MAX = parsePositiveInteger(process.env.ROUTES_RATE_LIMIT_MAX, 120);

const createRateLimiter = (windowMs: number, max: number) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "too many requests, please try again shortly" },
  });

const searchRateLimiter = createRateLimiter(SEARCH_RATE_LIMIT_WINDOW_MS, SEARCH_RATE_LIMIT_MAX);
const routesRateLimiter = createRateLimiter(ROUTES_RATE_LIMIT_WINDOW_MS, ROUTES_RATE_LIMIT_MAX);

const parseBbox = (bboxRaw: string): [number, number, number, number] | null => {
  const parts = bboxRaw.split(",").map((part) => Number(part.trim()));
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) {
    return null;
  }

  const [minLng, minLat, maxLng, maxLat] = parts;
  if (
    minLng >= maxLng ||
    minLat >= maxLat ||
    minLng < -180 ||
    maxLng > 180 ||
    minLat < -90 ||
    maxLat > 90
  ) {
    return null;
  }

  return [minLng, minLat, maxLng, maxLat];
};

const parseNear = (nearRaw: string): [number, number] | null => {
  const parts = nearRaw.split(",").map((part) => Number(part.trim()));
  if (parts.length !== 2 || parts.some((n) => !Number.isFinite(n))) {
    return null;
  }

  const [lng, lat] = parts;
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
    return null;
  }

  return [lng, lat];
};

const TRANSPORT_TYPES = ["danfo", "brt", "keke", "bus", "ferry", "mixed"] as const;
type TransportType = (typeof TRANSPORT_TYPES)[number];
const TRAFFIC_LEVELS = ["low", "medium", "high"] as const;
type TrafficLevel = (typeof TRAFFIC_LEVELS)[number];
const FARE_REPORT_SOURCES = ["system", "user_report", "admin_update"] as const;
type FareReportSource = (typeof FARE_REPORT_SOURCES)[number];
const REPORT_TYPES = ["traffic", "police", "roadblock", "accident", "hazard", "other"] as const;
type ReportType = (typeof REPORT_TYPES)[number];
const REPORT_SEVERITIES = ["low", "medium", "high"] as const;
type ReportSeverity = (typeof REPORT_SEVERITIES)[number];

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isPopulatedRouteRef = (
  value: unknown,
): value is {
  _id: unknown;
  name: string;
  origin: string;
  destination: string;
  transportType?: string;
  isActive?: boolean;
} => {
  if (!isObject(value)) return false;
  return (
    typeof value.name === "string" &&
    typeof value.origin === "string" &&
    typeof value.destination === "string"
  );
};

const isCoordinatePair = (value: unknown): value is [number, number] => {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1]) &&
    value[0] >= -180 &&
    value[0] <= 180 &&
    value[1] >= -90 &&
    value[1] <= 90
  );
};

const isTransportType = (value: unknown): value is TransportType =>
  typeof value === "string" && (TRANSPORT_TYPES as readonly string[]).includes(value);
const isTrafficLevel = (value: unknown): value is TrafficLevel =>
  typeof value === "string" && (TRAFFIC_LEVELS as readonly string[]).includes(value);
const isFareReportSource = (value: unknown): value is FareReportSource =>
  typeof value === "string" && (FARE_REPORT_SOURCES as readonly string[]).includes(value);
const isReportType = (value: unknown): value is ReportType =>
  typeof value === "string" && (REPORT_TYPES as readonly string[]).includes(value);
const isReportSeverity = (value: unknown): value is ReportSeverity =>
  typeof value === "string" && (REPORT_SEVERITIES as readonly string[]).includes(value);

const isPolylinePayload = (
  value: unknown,
): value is { type: "LineString"; coordinates: [number, number][] } => {
  if (!isObject(value)) return false;
  if (value.type !== "LineString") return false;
  if (!Array.isArray(value.coordinates) || value.coordinates.length < 2) return false;
  return value.coordinates.every((coord) => isCoordinatePair(coord));
};

const validateRouteCreatePayload = (body: unknown): string | null => {
  const validated = validateRouteCreateBody(body);
  return validated.success ? null : validated.error;
};

const validateRouteUpdatePayload = (body: unknown): string | null => {
  const validated = validateRouteUpdateBody(body);
  return validated.success ? null : validated.error;
};

const validateFareReportPayload = (body: unknown): string | null => {
  const validated = validateFareReportBody(body);
  return validated.success ? null : validated.error;
};

const isPointCoordsPayload = (value: unknown): value is { type: "Point"; coordinates: [number, number] } => {
  if (!isObject(value)) return false;
  if (value.type !== "Point") return false;
  if (!Array.isArray(value.coordinates) || value.coordinates.length !== 2) return false;
  const [lng, lat] = value.coordinates;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return false;
  return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
};

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

const haversineDistanceMeters = (from: [number, number], to: [number, number]): number => {
  const EARTH_RADIUS_METERS = 6_371_000;
  const [fromLng, fromLat] = from;
  const [toLng, toLat] = to;

  const latDelta = toRadians(toLat - fromLat);
  const lngDelta = toRadians(toLng - fromLng);
  const fromLatRad = toRadians(fromLat);
  const toLatRad = toRadians(toLat);

  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(fromLatRad) * Math.cos(toLatRad) * Math.sin(lngDelta / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
};

const computePathDistanceMeters = (coordinates: [number, number][]): number => {
  if (coordinates.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < coordinates.length; i += 1) {
    total += haversineDistanceMeters(coordinates[i - 1], coordinates[i]);
  }
  return Math.round(total);
};

const simplifyPathCoordinates = (coordinates: [number, number][]): [number, number][] => {
  if (coordinates.length <= 2) return coordinates;

  const SIMPLIFY_MIN_DELTA_METERS = 8;
  const simplified: [number, number][] = [coordinates[0]];
  let lastKept = coordinates[0];

  for (let i = 1; i < coordinates.length - 1; i += 1) {
    const current = coordinates[i];
    if (haversineDistanceMeters(lastKept, current) >= SIMPLIFY_MIN_DELTA_METERS) {
      simplified.push(current);
      lastKept = current;
    }
  }

  const finalPoint = coordinates[coordinates.length - 1];
  if (simplified[simplified.length - 1] !== finalPoint) {
    simplified.push(finalPoint);
  }

  if (simplified.length < 2) {
    return [coordinates[0], coordinates[coordinates.length - 1]];
  }

  return simplified;
};

const validateIncidentReportPayload = (body: unknown): string | null => {
  const validated = validateIncidentReportBody(body);
  return validated.success ? null : validated.error;
};

const validateStopCreatePayload = (body: unknown): string | null => {
  const validated = validateStopCreateBody(body);
  return validated.success ? null : validated.error;
};

const parseRouteIdFromBody = (body: unknown): string | null => {
  if (!isObject(body)) return null;
  const routeId = typeof body.routeId === "string" ? body.routeId.trim() : "";
  return isValidObjectId(routeId) ? routeId : null;
};

const getRoutesHandler = async (req: Request, res: Response) => {
  try {
    const filters: Record<string, unknown> = { isActive: true };

    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (q) {
      const regex = new RegExp(escapeRegex(q), "i");
      filters.$or = [
        { name: regex },
        { origin: regex },
        { destination: regex },
        { corridor: regex },
        { aliases: regex },
      ];
    }

    const bbox = typeof req.query.bbox === "string" ? req.query.bbox.trim() : "";
    if (bbox) {
      const parsed = parseBbox(bbox);
      if (!parsed) {
        return res.status(400).json({
          error:
            "bbox must be minLng,minLat,maxLng,maxLat with valid numeric bounds (WGS84).",
        });
      }

      const [minLng, minLat, maxLng, maxLat] = parsed;
      filters.polyline = {
        $geoIntersects: {
          $geometry: {
            type: "Polygon",
            coordinates: [
              [
                [minLng, minLat],
                [maxLng, minLat],
                [maxLng, maxLat],
                [minLng, maxLat],
                [minLng, minLat],
              ],
            ],
          },
        },
      };
    }

    const routes = await Route.find(filters).sort({ name: 1 }).lean();
    return res.status(200).json(routes);
  } catch (_error) {
    return res.status(500).json({ error: "failed to fetch routes" });
  }
};

app.get("/api/v1/routes", routesRateLimiter, getRoutesHandler);
app.get("/routes", routesRateLimiter, getRoutesHandler);

const getSavedRoutesHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "authentication required" });
    }

    const userDoc = await User.findOne({ _id: req.user.id, isActive: true })
      .select("savedRoutes")
      .populate(
        "savedRoutes",
        "name origin destination corridor aliases transportType baseFare confidenceScore isActive",
      )
      .lean();

    if (!userDoc) {
      return res.status(404).json({ error: "user not found" });
    }

    const savedRouteRefs = Array.isArray(userDoc.savedRoutes) ? userDoc.savedRoutes : [];
    const savedRoutes = savedRouteRefs
      .map((route) => {
        if (!isObject(route)) return null;
        if (route.isActive === false) return null;
        if (
          typeof route.name !== "string" ||
          typeof route.origin !== "string" ||
          typeof route.destination !== "string"
        ) {
          return null;
        }

        return {
          _id: String(route._id),
          name: route.name,
          origin: route.origin,
          destination: route.destination,
          corridor: typeof route.corridor === "string" ? route.corridor : "",
          aliases: Array.isArray(route.aliases)
            ? route.aliases.map((alias) => String(alias))
            : [],
          transportType: isTransportType(route.transportType) ? route.transportType : "danfo",
          baseFare: Number.isFinite(route.baseFare) ? Number(route.baseFare) : 0,
          confidenceScore:
            Number.isFinite(route.confidenceScore) && Number(route.confidenceScore) >= 0
              ? Number(route.confidenceScore)
              : 0.5,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.name.localeCompare(b.name));

    return res.status(200).json(savedRoutes);
  } catch (_error) {
    return res.status(500).json({ error: "failed to fetch saved routes" });
  }
};

const addSavedRouteHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "authentication required" });
    }

    const routeId = parseRouteIdFromBody(req.body);
    if (!routeId) {
      return res.status(400).json({ error: "routeId is required and must be a valid id" });
    }

    const route = await Route.findOne({ _id: routeId, isActive: true }).select("_id").lean();
    if (!route) {
      return res.status(404).json({ error: "route not found" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { savedRoutes: routeId } },
      { new: true },
    )
      .select("savedRoutes")
      .lean();

    if (!updatedUser) {
      return res.status(404).json({ error: "user not found" });
    }

    const savedCount = Array.isArray(updatedUser.savedRoutes) ? updatedUser.savedRoutes.length : 0;
    return res.status(200).json({ success: true, routeId, savedCount });
  } catch (_error) {
    return res.status(500).json({ error: "failed to save route" });
  }
};

const removeSavedRouteHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "authentication required" });
    }

    const routeId = typeof req.params.routeId === "string" ? req.params.routeId.trim() : "";
    if (!isValidObjectId(routeId)) {
      return res.status(400).json({ error: "invalid routeId" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { savedRoutes: routeId } },
      { new: true },
    )
      .select("savedRoutes")
      .lean();

    if (!updatedUser) {
      return res.status(404).json({ error: "user not found" });
    }

    const savedCount = Array.isArray(updatedUser.savedRoutes) ? updatedUser.savedRoutes.length : 0;
    return res.status(200).json({ success: true, routeId, savedCount });
  } catch (_error) {
    return res.status(500).json({ error: "failed to remove saved route" });
  }
};

app.get("/api/v1/routes/saved", authMiddleware, getSavedRoutesHandler);
app.post("/api/v1/routes/saved", authMiddleware, addSavedRouteHandler);
app.delete("/api/v1/routes/saved/:routeId", authMiddleware, removeSavedRouteHandler);

app.get("/routes/saved", authMiddleware, getSavedRoutesHandler);
app.post("/routes/saved", authMiddleware, addSavedRouteHandler);
app.delete("/routes/saved/:routeId", authMiddleware, removeSavedRouteHandler);

const getSearchHandler = async (req: Request, res: Response) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (!q) {
      return res.status(400).json({ error: "q query is required" });
    }

    const regex = new RegExp(escapeRegex(q), "i");

    const [routeMatches, stopMatches] = await Promise.all([
      Route.find({
        isActive: true,
        $or: [
          { name: regex },
          { origin: regex },
          { destination: regex },
          { corridor: regex },
          { aliases: regex },
        ],
      })
        .sort({ name: 1 })
        .limit(12)
        .lean(),
      Stop.find({ name: regex })
        .sort({ isMajor: -1, name: 1 })
        .limit(16)
        .populate("routeId", "name origin destination transportType isActive")
        .lean(),
    ]);

    const routes = routeMatches.map((route) => ({
      _id: String(route._id),
      name: route.name,
      origin: route.origin,
      destination: route.destination,
      transportType: route.transportType,
    }));

    const stops = stopMatches
      .map((stop) => {
        if (!isPopulatedRouteRef(stop.routeId) || stop.routeId.isActive === false) {
          return null;
        }

        return {
          _id: String(stop._id),
          name: stop.name,
          order: stop.order,
          isMajor: stop.isMajor,
          coords: stop.coords,
          route: {
            _id: String(stop.routeId._id),
            name: stop.routeId.name,
            origin: stop.routeId.origin,
            destination: stop.routeId.destination,
            transportType: stop.routeId.transportType || "danfo",
          },
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return res.status(200).json({
      query: q,
      routes,
      stops,
      counts: {
        routes: routes.length,
        stops: stops.length,
        total: routes.length + stops.length,
      },
    });
  } catch (_error) {
    return res.status(500).json({ error: "failed to search routes and stops" });
  }
};

app.get("/api/v1/search", searchRateLimiter, getSearchHandler);
app.get("/search", searchRateLimiter, getSearchHandler);

const getRouteByIdHandler = async (req: Request, res: Response) => {
  try {
    const routeId = req.params.routeId;
    if (!isValidObjectId(routeId)) {
      return res.status(400).json({ error: "invalid routeId" });
    }

    const route = await Route.findOne({ _id: routeId, isActive: true }).lean();
    if (!route) {
      return res.status(404).json({ error: "route not found" });
    }

    const stops = await Stop.find({ routeId: route._id }).sort({ order: 1 }).lean();
    return res.status(200).json({ ...route, stops });
  } catch (_error) {
    return res.status(500).json({ error: "failed to fetch route" });
  }
};

app.get("/api/v1/routes/:routeId", getRouteByIdHandler);
app.get("/routes/:routeId", getRouteByIdHandler);

const createRouteHandler = async (req: Request, res: Response) => {
  try {
    const validationError = validateRouteCreatePayload(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const body = req.body as Record<string, unknown>;
    const payload = {
      name: String(body.name).trim(),
      origin: String(body.origin).trim(),
      destination: String(body.destination).trim(),
      corridor: typeof body.corridor === "string" ? body.corridor.trim() : "",
      aliases:
        Array.isArray(body.aliases) && body.aliases.length > 0
          ? body.aliases.map((alias) => String(alias).trim())
          : [],
      transportType: isTransportType(body.transportType) ? body.transportType : ("danfo" as const),
      baseFare: Number(body.baseFare),
      confidenceScore:
        body.confidenceScore !== undefined ? Number(body.confidenceScore) : 0.5,
      polyline: body.polyline as { type: "LineString"; coordinates: [number, number][] },
      isActive: true,
    };

    const route = await Route.create(payload);
    return res.status(201).json(route);
  } catch (_error) {
    return res.status(500).json({ error: "failed to create route" });
  }
};

const updateRouteHandler = async (req: Request, res: Response) => {
  try {
    const routeId = req.params.routeId;
    if (!isValidObjectId(routeId)) {
      return res.status(400).json({ error: "invalid routeId" });
    }

    const validationError = validateRouteUpdatePayload(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const body = req.body as Record<string, unknown>;
    const updatePayload: Record<string, unknown> = {};

    if (body.name !== undefined) updatePayload.name = String(body.name).trim();
    if (body.origin !== undefined) updatePayload.origin = String(body.origin).trim();
    if (body.destination !== undefined)
      updatePayload.destination = String(body.destination).trim();
    if (body.corridor !== undefined) updatePayload.corridor = String(body.corridor).trim();
    if (body.aliases !== undefined) {
      updatePayload.aliases = (body.aliases as unknown[]).map((alias) => String(alias).trim());
    }
    if (body.transportType !== undefined) updatePayload.transportType = body.transportType;
    if (body.baseFare !== undefined) updatePayload.baseFare = Number(body.baseFare);
    if (body.confidenceScore !== undefined)
      updatePayload.confidenceScore = Number(body.confidenceScore);
    if (body.polyline !== undefined) updatePayload.polyline = body.polyline;
    if (body.isActive !== undefined) updatePayload.isActive = body.isActive;

    const updated = await Route.findByIdAndUpdate(routeId, { $set: updatePayload }, { new: true });
    if (!updated) {
      return res.status(404).json({ error: "route not found" });
    }

    return res.status(200).json(updated);
  } catch (_error) {
    return res.status(500).json({ error: "failed to update route" });
  }
};

const deleteRouteHandler = async (req: Request, res: Response) => {
  try {
    const routeId = req.params.routeId;
    if (!isValidObjectId(routeId)) {
      return res.status(400).json({ error: "invalid routeId" });
    }

    const deleted = await Route.findByIdAndDelete(routeId);
    if (!deleted) {
      return res.status(404).json({ error: "route not found" });
    }

    await Stop.deleteMany({ routeId });
    return res.status(200).json({ success: true, deletedRouteId: routeId });
  } catch (_error) {
    return res.status(500).json({ error: "failed to delete route" });
  }
};

app.post("/api/v1/routes", authMiddleware, requireRoles(["admin"]), createRouteHandler);
app.put("/api/v1/routes/:routeId", authMiddleware, requireRoles(["admin"]), updateRouteHandler);
app.delete(
  "/api/v1/routes/:routeId",
  authMiddleware,
  requireRoles(["admin"]),
  deleteRouteHandler,
);

app.post("/routes", authMiddleware, requireRoles(["admin"]), createRouteHandler);
app.put("/routes/:routeId", authMiddleware, requireRoles(["admin"]), updateRouteHandler);
app.delete("/routes/:routeId", authMiddleware, requireRoles(["admin"]), deleteRouteHandler);

const getStopsNearHandler = async (req: Request, res: Response) => {
  try {
    const near = typeof req.query.near === "string" ? req.query.near.trim() : "";
    if (!near) {
      return res.status(400).json({ error: "near query is required in format lng,lat" });
    }

    const parsedNear = parseNear(near);
    if (!parsedNear) {
      return res.status(400).json({
        error: "near must be in format lng,lat with valid WGS84 coordinates",
      });
    }

    let radius = 500;
    if (req.query.radius !== undefined) {
      const parsedRadius = Number(req.query.radius);
      if (!Number.isFinite(parsedRadius) || parsedRadius <= 0) {
        return res.status(400).json({ error: "radius must be a positive number in meters" });
      }
      radius = Math.min(parsedRadius, 20000);
    }

    const [lng, lat] = parsedNear;
    const stops = await Stop.find({
      coords: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          $maxDistance: radius,
        },
      },
    })
      .limit(100)
      .populate("routeId", "name origin destination transportType")
      .lean();

    return res.status(200).json(stops);
  } catch (_error) {
    return res.status(500).json({ error: "failed to fetch nearby stops" });
  }
};

app.get("/api/v1/stops", getStopsNearHandler);
app.get("/stops", getStopsNearHandler);

const createStopHandler = async (req: Request, res: Response) => {
  try {
    const validationError = validateStopCreatePayload(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const body = req.body as Record<string, unknown>;
    const routeId = String(body.routeId).trim();
    const route = await Route.findOne({ _id: routeId, isActive: true }).select("_id").lean();
    if (!route) {
      return res.status(404).json({ error: "route not found" });
    }

    const created = await Stop.create({
      routeId,
      name: String(body.name).trim(),
      order: Number(body.order),
      isMajor: Boolean(body.isMajor),
      coords: body.coords as { type: "Point"; coordinates: [number, number] },
    });

    return res.status(201).json(created);
  } catch (_error) {
    return res.status(500).json({ error: "failed to create stop" });
  }
};

app.post("/api/v1/stops", authMiddleware, requireRoles(["admin"]), createStopHandler);
app.post("/stops", authMiddleware, requireRoles(["admin"]), createStopHandler);

const getFareEstimateHandler = async (req: Request, res: Response) => {
  try {
    const routeId = typeof req.query.routeId === "string" ? req.query.routeId.trim() : "";
    if (!routeId) {
      return res.status(400).json({ error: "routeId query is required" });
    }

    const time = typeof req.query.time === "string" ? req.query.time.trim() : undefined;
    const trafficLevel =
      typeof req.query.trafficLevel === "string" ? req.query.trafficLevel.trim() : undefined;

    const estimate = await estimateRouteFare({ routeId, time, trafficLevel });
    return res.status(200).json(estimate);
  } catch (error) {
    if (error instanceof FareServiceError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: "failed to estimate fare" });
  }
};

app.get("/api/v1/fare/estimate", getFareEstimateHandler);
app.get("/fare/estimate", getFareEstimateHandler);

const createFareReportHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "authentication required" });
    }

    const validationError = validateFareReportPayload(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const body = req.body as Record<string, unknown>;
    const routeId = String(body.routeId).trim();
    const route = await Route.findOne({ _id: routeId, isActive: true }).select("_id").lean();
    if (!route) {
      return res.status(404).json({ error: "route not found" });
    }

    const created = await Fare.create({
      routeId,
      amount: Number(body.reportedFare),
      source: isFareReportSource(body.source) ? body.source : ("user_report" as const),
      trafficLevel: isTrafficLevel(body.trafficLevel) ? body.trafficLevel : ("medium" as const),
      reportedBy: req.user.id,
      notes: typeof body.notes === "string" ? body.notes.trim() : "",
    });

    emitFareReported({
      id: String(created._id),
      routeId: String(created.routeId),
      amount: created.amount,
      trafficLevel: created.trafficLevel,
      reportedBy: String(created.reportedBy),
      createdAt: created.createdAt,
    });

    return res.status(201).json(created);
  } catch (_error) {
    return res.status(500).json({ error: "failed to save fare report" });
  }
};

app.post("/api/v1/fare/report", authMiddleware, createFareReportHandler);
app.post("/fare/report", authMiddleware, createFareReportHandler);

const getReportsByBboxHandler = async (req: Request, res: Response) => {
  try {
    const bbox = typeof req.query.bbox === "string" ? req.query.bbox.trim() : "";
    if (!bbox) {
      return res.status(400).json({
        error: "bbox query is required as minLng,minLat,maxLng,maxLat",
      });
    }

    const parsed = parseBbox(bbox);
    if (!parsed) {
      return res.status(400).json({
        error:
          "bbox must be minLng,minLat,maxLng,maxLat with valid numeric bounds (WGS84).",
      });
    }

    const [minLng, minLat, maxLng, maxLat] = parsed;
    const reports = await Report.find({
      isActive: true,
      coords: {
        $geoWithin: {
          $geometry: {
            type: "Polygon",
            coordinates: [
              [
                [minLng, minLat],
                [maxLng, minLat],
                [maxLng, maxLat],
                [minLng, maxLat],
                [minLng, minLat],
              ],
            ],
          },
        },
      },
    })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return res.status(200).json(reports);
  } catch (_error) {
    return res.status(500).json({ error: "failed to fetch reports" });
  }
};

app.get("/api/v1/reports", getReportsByBboxHandler);
app.get("/reports", getReportsByBboxHandler);

const createIncidentReportHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "authentication required" });
    }

    const validationError = validateIncidentReportPayload(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const body = req.body as Record<string, unknown>;
    const routeId = typeof body.routeId === "string" ? body.routeId.trim() : undefined;
    const reportType = body.type as ReportType;
    const severity = isReportSeverity(body.severity) ? body.severity : ("medium" as const);
    const description = typeof body.description === "string" ? body.description.trim() : "";
    if (routeId) {
      const route = await Route.findOne({ _id: routeId, isActive: true }).select("_id").lean();
      if (!route) {
        return res.status(404).json({ error: "route not found" });
      }
    }

    const coords = body.coords as { type: "Point"; coordinates: [number, number] };
    const created = await Report.create({
      routeId: routeId || undefined,
      userId: req.user.id,
      type: reportType,
      severity,
      description,
      coords,
      isActive: true,
    });

    emitReportCreated({
      id: String(created._id),
      routeId: created.routeId ? String(created.routeId) : undefined,
      userId: String(created.userId),
      type: created.type,
      severity: created.severity,
      description: created.description,
      coords: created.coords,
      createdAt: created.createdAt,
    });

    return res.status(201).json(created);
  } catch (_error) {
    return res.status(500).json({ error: "failed to save report" });
  }
};

app.post("/api/v1/reports", authMiddleware, createIncidentReportHandler);
app.post("/reports", authMiddleware, createIncidentReportHandler);

const createTripRecordHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "authentication required" });
    }

    const validated = validateTripCreateBody(req.body);
    if (!validated.success) {
      return res.status(400).json({ error: validated.error });
    }

    const { routeId, checkpoints, startedAt, endedAt } = validated.data;

    if (routeId) {
      const route = await Route.findOne({ _id: routeId, isActive: true }).select("_id").lean();
      if (!route) {
        return res.status(404).json({ error: "route not found" });
      }
    }

    const normalizedCheckpoints = checkpoints
      .map((checkpoint) => ({
        coords: checkpoint.coords,
        recordedAt: checkpoint.recordedAt || new Date(),
      }))
      .sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());

    if (normalizedCheckpoints.length < 2) {
      return res.status(400).json({ error: "at least 2 checkpoints are required to record a trip" });
    }

    const tripStartedAt = startedAt || normalizedCheckpoints[0].recordedAt;
    const tripEndedAt = endedAt || normalizedCheckpoints[normalizedCheckpoints.length - 1].recordedAt;

    if (tripEndedAt.getTime() < tripStartedAt.getTime()) {
      return res.status(400).json({ error: "endedAt must be after startedAt" });
    }

    const rawCoordinates = normalizedCheckpoints.map(
      (checkpoint) => checkpoint.coords.coordinates as [number, number],
    );
    const simplifiedCoordinates = simplifyPathCoordinates(rawCoordinates);
    const distanceMeters = computePathDistanceMeters(rawCoordinates);
    const durationSeconds = Math.max(0, Math.round((tripEndedAt.getTime() - tripStartedAt.getTime()) / 1000));

    const created = await TripRecord.create({
      userId: req.user.id,
      routeId: routeId || undefined,
      checkpoints: normalizedCheckpoints,
      polyline: {
        type: "LineString",
        coordinates: simplifiedCoordinates,
      },
      distanceMeters,
      durationSeconds,
      startedAt: tripStartedAt,
      endedAt: tripEndedAt,
    });

    emitTripRecorded({
      id: String(created._id),
      userId: String(created.userId),
      routeId: created.routeId ? String(created.routeId) : undefined,
      distanceMeters: created.distanceMeters,
      durationSeconds: created.durationSeconds,
      checkpointsCount: created.checkpoints.length,
      startedAt: created.startedAt,
      endedAt: created.endedAt,
      createdAt: created.createdAt,
    });

    return res.status(201).json(created);
  } catch (_error) {
    return res.status(500).json({ error: "failed to save trip record" });
  }
};

app.post("/api/v1/trips", authMiddleware, createTripRecordHandler);
app.post("/trips", authMiddleware, createTripRecordHandler);

const getTripsHistoryHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "authentication required" });
    }

    const userId = typeof req.query.userId === "string" ? req.query.userId.trim() : "";
    if (!userId) {
      return res.status(400).json({ error: "userId query is required" });
    }
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ error: "userId must be a valid id" });
    }

    const isAdmin = req.user.role === "admin";
    if (!isAdmin && req.user.id !== userId) {
      return res.status(403).json({ error: "forbidden" });
    }

    const trips = await TripRecord.find({ userId })
      .sort({ startedAt: -1 })
      .limit(200)
      .populate("routeId", "name origin destination transportType")
      .lean();

    return res.status(200).json(trips);
  } catch (_error) {
    return res.status(500).json({ error: "failed to fetch trip history" });
  }
};

app.get("/api/v1/trips", authMiddleware, getTripsHistoryHandler);
app.get("/trips", authMiddleware, getTripsHistoryHandler);

const startServer = async (): Promise<void> => {
  try {
    await connectToDatabase();
    await ensureCoreIndexes();
    const httpServer = createServer(app);
    initRealtimeServer(httpServer, corsOrigin);
    httpServer.listen(port, () => {
      console.log(`Backend listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start backend:", error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== "test") {
  void startServer();
}
