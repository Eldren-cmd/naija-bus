import cors from "cors";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5000);
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get("/api/v1/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "backend" });
});

app.get("/api/v1/routes", (_req, res) => {
  res.status(200).json([]);
});

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
