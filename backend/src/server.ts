import cors from "cors";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import { connectToDatabase, ensureCoreIndexes, getDatabaseStatus } from "./config/db";
import { Route, Stop } from "./models";
import { authMiddleware, requireRoles } from "./middleware/authMiddleware";
import { authRouter } from "./routes/auth";
import { FareServiceError, estimateRouteFare } from "./services/fareService";

dotenv.config();

export const app = express();
const port = Number(process.env.PORT || 5000);
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: corsOrigin }));
app.use(express.json());
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

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

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

const isPolylinePayload = (
  value: unknown,
): value is { type: "LineString"; coordinates: [number, number][] } => {
  if (!isObject(value)) return false;
  if (value.type !== "LineString") return false;
  if (!Array.isArray(value.coordinates) || value.coordinates.length < 2) return false;
  return value.coordinates.every((coord) => isCoordinatePair(coord));
};

const validateRouteCreatePayload = (body: unknown): string | null => {
  if (!isObject(body)) return "request body must be an object";

  if (typeof body.name !== "string" || !body.name.trim()) return "name is required";
  if (typeof body.origin !== "string" || !body.origin.trim()) return "origin is required";
  if (typeof body.destination !== "string" || !body.destination.trim())
    return "destination is required";
  if (!Number.isFinite(body.baseFare) || Number(body.baseFare) < 0)
    return "baseFare must be a non-negative number";
  if (!isPolylinePayload(body.polyline))
    return "polyline must be a valid GeoJSON LineString with at least 2 coordinates";
  if (
    body.transportType !== undefined &&
    !isTransportType(body.transportType)
  ) {
    return "transportType is invalid";
  }
  if (
    body.confidenceScore !== undefined &&
    (!Number.isFinite(body.confidenceScore) ||
      Number(body.confidenceScore) < 0 ||
      Number(body.confidenceScore) > 1)
  ) {
    return "confidenceScore must be between 0 and 1";
  }
  if (
    body.aliases !== undefined &&
    (!Array.isArray(body.aliases) || body.aliases.some((alias) => typeof alias !== "string"))
  ) {
    return "aliases must be an array of strings";
  }

  return null;
};

const validateRouteUpdatePayload = (body: unknown): string | null => {
  if (!isObject(body)) return "request body must be an object";
  if (Object.keys(body).length === 0) return "at least one field is required";

  if (body.name !== undefined && (typeof body.name !== "string" || !body.name.trim())) {
    return "name must be a non-empty string";
  }
  if (body.origin !== undefined && (typeof body.origin !== "string" || !body.origin.trim())) {
    return "origin must be a non-empty string";
  }
  if (
    body.destination !== undefined &&
    (typeof body.destination !== "string" || !body.destination.trim())
  ) {
    return "destination must be a non-empty string";
  }
  if (
    body.baseFare !== undefined &&
    (!Number.isFinite(body.baseFare) || Number(body.baseFare) < 0)
  ) {
    return "baseFare must be a non-negative number";
  }
  if (
    body.transportType !== undefined &&
    !isTransportType(body.transportType)
  ) {
    return "transportType is invalid";
  }
  if (
    body.confidenceScore !== undefined &&
    (!Number.isFinite(body.confidenceScore) ||
      Number(body.confidenceScore) < 0 ||
      Number(body.confidenceScore) > 1)
  ) {
    return "confidenceScore must be between 0 and 1";
  }
  if (body.polyline !== undefined && !isPolylinePayload(body.polyline)) {
    return "polyline must be a valid GeoJSON LineString with at least 2 coordinates";
  }
  if (
    body.aliases !== undefined &&
    (!Array.isArray(body.aliases) || body.aliases.some((alias) => typeof alias !== "string"))
  ) {
    return "aliases must be an array of strings";
  }
  if (body.isActive !== undefined && typeof body.isActive !== "boolean") {
    return "isActive must be boolean";
  }

  return null;
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

app.get("/api/v1/routes", getRoutesHandler);
app.get("/routes", getRoutesHandler);

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

const startServer = async (): Promise<void> => {
  try {
    await connectToDatabase();
    await ensureCoreIndexes();
    app.listen(port, () => {
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
