import "dotenv/config";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { corsMiddleware } from "./config/cors.js";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import iconRoutes from "./routes/icons.js";
import userRoutes from "./routes/users.js";
import appRoutes from "./routes/apps.js";
import activityRoutes from "./routes/activity.js";

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(helmet());
app.use(corsMiddleware);
app.use(express.json({ limit: "4mb" }));
app.use(morgan("tiny"));

app.get("/", (_req, res) =>
  res.json({ message: "Portal Disdikwilayah API is running", health: "/health" }),
);
app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/app-icons", iconRoutes);
app.use("/api/users", userRoutes);
app.use("/api/activity-logs", activityRoutes);
app.use("/api", appRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Terjadi kesalahan pada server." });
});

if (!process.env.VERCEL) {
  app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
}

export default app;