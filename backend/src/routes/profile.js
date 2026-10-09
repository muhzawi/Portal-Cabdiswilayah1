import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { writeAuditLog } from "../audit.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const [rows] = await db.query(
      "SELECT id, full_name, email, institution, nip, role, status, created_at FROM users WHERE id = ?",
      [req.user.id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Pengguna tidak ditemukan." });
    }
    res.json({ profile: rows[0] });
  } catch (error) {
    next(error);
  }
});

router.patch("/", async (req, res, next) => {
  try {
    const fullName = typeof req.body.fullName === "string" ? req.body.fullName.trim() : "";
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const institution = typeof req.body.institution === "string" ? req.body.institution.trim() : "";
    const nip = typeof req.body.nip === "string" ? req.body.nip.trim() : "";

    if (fullName.length < 2 || fullName.length > 100) {
      return res.status(400).json({ error: "Nama lengkap harus terdiri dari 2-100 karakter." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Format email tidak valid." });
    }
    if (institution.length > 255 || nip.length > 50) {
      return res.status(400).json({ error: "Asal instansi atau NIP terlalu panjang." });
    }

    const [existing] = await db.query(
      "SELECT id FROM users WHERE email = ? AND id <> ?",
      [email, req.user.id],
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: "Email sudah digunakan akun lain." });
    }

    await db.query(
      "UPDATE users SET full_name = ?, email = ?, institution = ?, nip = ? WHERE id = ?",
      [fullName, email, institution, nip, req.user.id],
    );
    const [rows] = await db.query(
      "SELECT id, full_name, email, institution, nip, role, status, created_at FROM users WHERE id = ?",
      [req.user.id],
    );

    await writeAuditLog({
      actorId: req.user.id,
      action: "profile_updated",
      details: { fields: ["full_name", "email", "institution", "nip"] },
    });
    res.json({ message: "Profil berhasil diperbarui.", profile: rows[0] });
  } catch (error) {
    next(error);
  }
});

export default router;