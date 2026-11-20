import cors from "cors";

const rawFrontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
const envOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const configuredOrigins = new Set(
  [rawFrontendUrl, "http://localhost:5173", "http://127.0.0.1:5173", ...envOrigins].map(
    (url) => url.replace(/\/+$/, "")
  )
);

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/+$/, "");

    if (
      configuredOrigins.has("*") ||
      configuredOrigins.has(cleanOrigin) ||
      cleanOrigin.endsWith(".vercel.app")
    ) {
      return callback(null, true);
    }

    console.warn(`[CORS Blocked] Origin tidak diizinkan: ${origin}`);
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  optionsSuccessStatus: 200,
});