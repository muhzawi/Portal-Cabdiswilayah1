import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { writeAuditLog } from "../audit.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// POST /auth/signup (Pendaftaran Manual / Admin Mode)
router.post("/signup", async (req, res, next) => {
  try {
    const { email, password, fullName } = req.body;
    if (!email || !password || password.length < 8) {
      return res.status(400).json({ error: "Email dan password minimal 8 karakter wajib diisi." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [cleanEmail]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Email sudah terdaftar." });
    }

    // Endpoint ini tidak boleh menjadi jalur eskalasi hak akses publik.
    const targetRole = "staff";
    const status = "pending";
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = `usr-${Date.now()}`;
    const name = fullName ? fullName.trim() : cleanEmail.split("@")[0];

    await db.query(
      "INSERT INTO users (id, full_name, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, name, cleanEmail, hashedPassword, targetRole, status]
    );

    await writeAuditLog({ actorId: userId, action: "user_registered", targetId: userId, details: { role: targetRole } });

    const user = { id: userId, full_name: name, email: cleanEmail, role: targetRole, status };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: "1d" });

    res.status(201).json({ token, user });
  } catch (error) {
    next(error);
  }
});

// POST /auth/register (Pendaftaran Publik untuk Staff)
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validasi input
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Nama, email, dan password wajib diisi." });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password minimal 8 karakter." });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Cek ketersediaan email
    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [cleanEmail]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Email sudah terdaftar." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = `usr-${Date.now()}`;

    // Default pendaftaran publik: role 'staff' & status 'pending'
    await db.query(
      "INSERT INTO users (id, full_name, email, password, role, status) VALUES (?, ?, ?, ?, 'staff', 'pending')",
      [userId, name.trim(), cleanEmail, hashedPassword]
    );

    await writeAuditLog({ actorId: userId, action: "staff_registered", targetId: userId });

    res.status(201).json({
      message: "Registrasi berhasil! Akun Anda sedang menunggu persetujuan Super Admin / Admin.",
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email dan password wajib diisi." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [cleanEmail]);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Email atau password salah." });
    }

    if (user.status === "pending") {
      return res.status(403).json({
        error: "Akun Anda masih dalam proses verifikasi (pending). Silakan hubungi Super Admin / Admin.",
      });
    }

    if (user.status === "rejected") {
      return res.status(403).json({
        error: "Akun Anda telah ditolak (rejected). Anda tidak dapat masuk ke portal.",
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, status: user.status, full_name: user.full_name },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    await writeAuditLog({ actorId: user.id, action: "login" });

    res.json({
      token,
      user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role, status: user.status },
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/reset-password (Ubah password oleh user terautentikasi)
router.post("/reset-password", requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
      return res.status(400).json({ error: "Password lama dan password baru wajib diisi." });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "Password baru minimal 8 karakter." });
    }

    const [rows] = await db.query("SELECT password FROM users WHERE id = ?", [req.user.id]);
    if (!rows[0] || !(await bcrypt.compare(currentPassword, rows[0].password))) {
      return res.status(400).json({ error: "Password lama tidak sesuai." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, req.user.id]);
    await writeAuditLog({ actorId: req.user.id, action: "password_changed" });

    res.json({ message: "Password berhasil diperbarui." });
  } catch (error) {
    next(error);
  }
});

// POST /auth/logout (Stateless JWT Logout)
router.post("/logout", requireAuth, (_req, res) => {
  res.status(200).json({ message: "Logout berhasil." });
});

// PATCH /auth/profile (Ubah data profil dasar)
router.patch("/profile", requireAuth, async (req, res, next) => {
  try {
    const fullName = typeof req.body.fullName === "string" ? req.body.fullName.trim() : "";
    if (fullName.length < 2 || fullName.length > 100) {
      return res.status(400).json({ error: "Nama lengkap harus terdiri dari 2-100 karakter." });
    }

    const [result] = await db.query(
      "UPDATE users SET full_name = ?, updated_at = NOW() WHERE id = ?",
      [fullName, req.user.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Pengguna tidak ditemukan." });
    }

    await writeAuditLog({ actorId: req.user.id, action: "profile_updated", details: { fields: ["full_name"] } });
    const [rows] = await db.query(
      "SELECT id, full_name, email, role, status, created_at FROM users WHERE id = ?",
      [req.user.id]
    );
    res.json({ message: "Profil berhasil diperbarui.", user: rows[0] });
  } catch (error) {
    next(error);
  }
});

// GET /auth/me
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const [rows] = await db.query(
      "SELECT id, full_name, email, role, status, created_at FROM users WHERE id = ?",
      [req.user.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: "Pengguna tidak ditemukan." });
    }
    
    res.json({ user: rows[0] });
  } catch (error) {
    next(error);
  }
});

export default router;