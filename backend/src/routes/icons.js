import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
const allowedMimeTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);

router.post("/", requireAuth, requireRole("admin", "super_user"), (req, res) => {
  const { mimeType, data } = req.body;
  const prefix = `data:${mimeType};base64,`;

  if (!allowedMimeTypes.has(mimeType) || typeof data !== "string" || !data.startsWith(prefix)) {
    return res.status(400).json({ error: "Format ikon harus PNG, JPG, WEBP, atau SVG." });
  }

  const encoded = data.slice(prefix.length);
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) {
    return res.status(400).json({ error: "File ikon tidak valid." });
  }

  const fileBuffer = Buffer.from(encoded, "base64");
  if (!fileBuffer.length || fileBuffer.length > 2 * 1024 * 1024) {
    return res.status(400).json({ error: "Ukuran file ikon maksimal 2 MB." });
  }

  res.status(201).json({ iconUrl: data });
});

export default router;