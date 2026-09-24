import "dotenv/config";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { corsMiddleware } from "./config/cors.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import appRoutes from "./routes/apps.js";
import activityRoutes from "./routes/activity.js";

const app = express();
const port = Number(process.env.PORT || 3000);

// Global Middlewares
app.use(helmet());
app.use(corsMiddleware);
app.use(express.json({ limit: "100kb" }));
app.use(morgan("tiny"));

// Health Checks
app.get("/", (_req, res) => res.json({ message: "Portal Disdikwilayah API is running", health: "/health" }));
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Register Routes
app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes); // Dukungan fallback untuk alias /api/auth
app.use("/api/users", userRoutes);
app.use("/api/activity-logs", activityRoutes);
app.use("/api", appRoutes);

// Centralized Error Handler
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Terjadi kesalahan pada server." });
});

if (!process.env.VERCEL) {
  app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
}

export default app;