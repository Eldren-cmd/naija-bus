import cors from "cors";
import dotenv from "dotenv";
import express from "express";
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

app.get("/api/v1/routes", async (_req, res) => {
  try {
    const routes = await Route.find({ isActive: true }).sort({ name: 1 }).lean();
    return res.status(200).json(routes);
  } catch (_error) {
    return res.status(500).json({ error: "failed to fetch routes" });
  }
});

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
