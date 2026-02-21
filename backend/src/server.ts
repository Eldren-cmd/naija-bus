import cors from "cors";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import { connectToDatabase, ensureCoreIndexes, getDatabaseStatus } from "./config/db";
import { Route } from "./models";
import { authRouter } from "./routes/auth";

dotenv.config();

const app = express();
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

void startServer();
