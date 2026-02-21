import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { connectToDatabase, ensureCoreIndexes, getDatabaseStatus } from "./config/db";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5000);
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get("/api/v1/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "backend",
    database: getDatabaseStatus(),
  });
});

app.get("/api/v1/routes", (_req, res) => {
  res.status(200).json([]);
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
