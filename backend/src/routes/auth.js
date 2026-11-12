import { Router } from "express";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import db from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { writeAuditLog } from "../audit.js";
import { createAuthSessionToken } from "../security/auth-sessions.js";
import {
  clearLoginFailures,
  getClientIp,
  isLoginIpBlocked,
  recordFailedLogin,
} from "../security/login-protection.js";
import {
  isSmtpConfigured,
  sendPasswordResetEmail,
  sendSchoolVerificationEmail,
} from "../email.js";

const router = Router();
const genericResetResponse = {
  message: "Jika email terdaftar, instruksi reset password akan dikirim.",
};

router.post("/forgot-password", async (req, res, next) => {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Alamat email tidak valid." });
    }
    if (!isSmtpConfigured()) {
      return res.status(503).json({
        error: "Layanan email belum dikonfigurasi. Hubungi administrator portal.",
      });
    }

    const [users] = await db.query(
      "SELECT id, full_name, email FROM users WHERE email = ?",
      [email],
    );
    if (users.length === 0) return res.json(genericResetResponse);

    const user = users[0];
    await db.query(
      "DELETE FROM password_reset_tokens WHERE user_id = ? AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)",
      [user.id],
    );
    const [attempts] = await db.query(
      "SELECT COUNT(*) AS total FROM password_reset_tokens WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 15 MINUTE)",
      [user.id],
    );
    if (Number(attempts[0]?.total || 0) >= 3) return res.json(genericResetResponse);

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    await db.query(
      "UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL",
      [user.id],
    );
    await db.query(
      "INSERT INTO password_reset_tokens (token_hash, user_id, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))",
      [tokenHash, user.id],
    );

    const resetUrl = process.env.RESET_PASSWORD_URL
      ? new URL(process.env.RESET_PASSWORD_URL)
      : new URL("/reset-password", process.env.FRONTEND_URL || "http://localhost:5173");
    resetUrl.searchParams.set("token", rawToken);

    try {
      await sendPasswordResetEmail({
        to: user.email,
        fullName: user.full_name,
        resetUrl: resetUrl.toString(),
      });
    } catch (error) {
      await db.query(
        "UPDATE password_reset_tokens SET used_at = NOW() WHERE token_hash = ?",
        [tokenHash],
      );
      console.error("Email reset password gagal dikirim:", error.message);
      return res.status(503).json({
        error: "Email reset gagal dikirim. Periksa konfigurasi SMTP lalu coba lagi.",
      });
    }

    res.json(genericResetResponse);
  } catch (error) {
    next(error);
  }
});

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
    const token = await createAuthSessionToken(user, "user", userId);

    res.status(201).json({ token, user });
  } catch (error) {
    next(error);
  }
});

// POST /auth/register (Pendaftaran Publik untuk Staff)
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validasi input
    if (typeof name !== "string" || name.trim().length < 2 || !email || !password) {
      return res.status(400).json({ error: "Nama, email, dan password wajib diisi." });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ error: "Password minimal 8 karakter." });
    }
    if (confirmPassword !== password) {
      return res.status(400).json({ error: "Konfirmasi password tidak cocok dengan password." });
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

router.post("/school-login", async (req, res, next) => {
  try {
    const clientIp = getClientIp(req);
    if (await isLoginIpBlocked(clientIp)) {
      return res.status(429).json({
        error: "Terlalu banyak percobaan login gagal. IP diblokir selama 10 menit.",
      });
    }

    const npsn = typeof req.body.npsn === "string" ? req.body.npsn.trim() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";
    if (!/^\d{8}$/.test(npsn)) {
      return res.status(400).json({ error: "NPSN harus berupa 8 digit angka." });
    }
    if (!password) {
      return res.status(400).json({ error: "NPSN dan password wajib diisi." });
    }

    const [rows] = await db.query(
      "SELECT npsn, name, password_hash, status, email, email_verified_at FROM schools WHERE npsn = ?",
      [npsn],
    );
    const school = rows[0];
    if (!school || !(await bcrypt.compare(password, school.password_hash))) {
      const blocked = await recordFailedLogin(clientIp);
      return res.status(blocked ? 429 : 401).json({
        error: blocked
          ? "Terlalu banyak percobaan login gagal. IP diblokir selama 10 menit."
          : "NPSN atau password salah.",
      });
    }
    await clearLoginFailures(clientIp);
    if (school.status === "rejected") {
      return res.status(403).json({ error: "Akun sekolah ditolak. Hubungi administrator." });
    }

    const token = await createAuthSessionToken(
      { npsn: school.npsn, name: school.name, role: "school_user", type: "school" },
      "school",
      school.npsn,
    );
    res.json({
      session: { access_token: token },
      user: {
        id: school.npsn,
        npsn: school.npsn,
        name: school.name,
        full_name: school.name,
        institution: school.name,
        nip: school.npsn,
        role: "school_user",
        type: "school",
        status: school.status,
        email: school.email,
        emailVerified: Boolean(school.email_verified_at),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/school/request-link", requireAuth, async (req, res, next) => {
  try {
    const npsn = typeof req.body.npsn === "string" ? req.body.npsn.trim() : "";
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (!/^\d{8}$/.test(npsn) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "NPSN atau alamat email tidak valid." });
    }
    if (req.user?.type !== "school" || req.user.npsn !== npsn) {
      return res.status(403).json({ error: "Sesi sekolah tidak sesuai." });
    }
    if (!isSmtpConfigured()) {
      return res.status(503).json({ error: "Layanan email belum dikonfigurasi. Hubungi administrator portal." });
    }

    const [schools] = await db.query(
      "SELECT npsn, name, status, email FROM schools WHERE npsn = ?",
      [npsn],
    );
    const school = schools[0];
    if (!school) {
      return res.status(404).json({ error: "NPSN belum terdaftar. Hubungi administrator Cabang Dinas." });
    }
    if (school.status === "rejected") {
      return res.status(403).json({ error: "Permohonan sekolah ditolak. Hubungi administrator." });
    }
    if (school.email && school.email.toLowerCase() !== email) {
      return res.status(409).json({ error: "Email berbeda dari email sekolah yang sudah terdaftar. Hubungi administrator." });
    }

    const [duplicates] = await db.query(
      "SELECT npsn FROM schools WHERE npsn <> ? AND (email = ? OR pending_email = ?) LIMIT 1",
      [npsn, email, email],
    );
    if (duplicates.length > 0) {
      return res.status(409).json({ error: "Email tersebut sudah digunakan oleh sekolah lain." });
    }

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query(
        "UPDATE school_email_verification_tokens SET used_at = NOW() WHERE school_npsn = ? AND used_at IS NULL",
        [npsn],
      );
      await connection.query(
        "UPDATE schools SET pending_email = ?, status = IF(email IS NULL, 'pending', status) WHERE npsn = ?",
        [email, npsn],
      );
      await connection.query(
        "INSERT INTO school_email_verification_tokens (token_hash, school_npsn, email, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))",
        [tokenHash, npsn, email],
      );
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    const verifyUrl = new URL("/school/verify", process.env.FRONTEND_URL || "http://localhost:5173");
    verifyUrl.searchParams.set("token", rawToken);
    try {
      await sendSchoolVerificationEmail({
        to: email,
        schoolName: school.name,
        verifyUrl: verifyUrl.toString(),
      });
    } catch (error) {
      await db.query(
        "UPDATE school_email_verification_tokens SET used_at = NOW() WHERE token_hash = ?",
        [tokenHash],
      );
      next(error);
      return;
    }

    res.json({
      message: "Tautan verifikasi telah dikirim. Setelah email diverifikasi, admin perlu menyetujui akses sekolah.",
    });
  } catch (error) {
    next(error);
  }
});

router.post("/school/verify", async (req, res, next) => {
  const authorization = req.get("authorization") || "";
  const rawToken = typeof req.body.token === "string"
    ? req.body.token
    : authorization.startsWith("Bearer ")
      ? authorization.slice(7)
      : "";
  if (!/^[a-f0-9]{64}$/i.test(rawToken)) {
    return res.status(400).json({ error: "Tautan verifikasi tidak valid atau sudah kedaluwarsa." });
  }

  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [tokens] = await connection.query(
      "SELECT school_npsn, email FROM school_email_verification_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW() FOR UPDATE",
      [tokenHash],
    );
    if (tokens.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: "Tautan verifikasi tidak valid atau sudah kedaluwarsa." });
    }

    const { school_npsn: npsn, email } = tokens[0];
    const [schools] = await connection.query(
      "SELECT npsn, name, status, pending_email FROM schools WHERE npsn = ? FOR UPDATE",
      [npsn],
    );
    const school = schools[0];
    if (!school || school.pending_email !== email) {
      await connection.rollback();
      return res.status(403).json({ error: "Email tidak terhubung ke sekolah yang terdaftar." });
    }

    await connection.query(
      "UPDATE schools SET email = ?, pending_email = NULL, email_verified_at = NOW() WHERE npsn = ?",
      [email, npsn],
    );
    await connection.query(
      "UPDATE school_email_verification_tokens SET used_at = NOW() WHERE token_hash = ?",
      [tokenHash],
    );
    await connection.commit();

    if (school.status === "pending") {
      return res.status(403).json({ error: "Email berhasil diverifikasi. Permohonan akses Anda menunggu persetujuan admin." });
    }
    if (school.status !== "approved") {
      return res.status(403).json({ error: "Akses sekolah belum disetujui admin." });
    }

    const token = await createAuthSessionToken(
      { npsn: school.npsn, name: school.name, role: "school_user", type: "school" },
      "school",
      school.npsn,
    );
    res.json({
      session: { access_token: token },
      user: {
        id: school.npsn,
        npsn: school.npsn,
        name: school.name,
        email,
        emailVerified: true,
        role: "school_user",
        type: "school",
        status: school.status,
      },
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

// POST /auth/login
router.post("/login", async (req, res, next) => {
  try {
    const clientIp = getClientIp(req);
    if (await isLoginIpBlocked(clientIp)) {
      return res.status(429).json({
        error: "Terlalu banyak percobaan login gagal. IP diblokir selama 10 menit.",
      });
    }

    const { email, password } = req.body;
    if (typeof email !== "string" || !email.trim() || typeof password !== "string" || !password) {
      return res.status(400).json({ error: "Email dan password wajib diisi." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [cleanEmail]);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      const blocked = await recordFailedLogin(clientIp);
      return res.status(blocked ? 429 : 401).json({
        error: blocked
          ? "Terlalu banyak percobaan login gagal. IP diblokir selama 10 menit."
          : "Email atau password salah.",
      });
    }
    await clearLoginFailures(clientIp);

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

    const token = await createAuthSessionToken(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        full_name: user.full_name,
        institution: user.institution || "",
        nip: user.nip || "",
      },
      "user",
      user.id,
    );

    await writeAuditLog({ actorId: user.id, action: "login" });

    res.json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        status: user.status,
        institution: user.institution || "",
        nip: user.nip || "",
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/reset-password/confirm", async (req, res, next) => {
  const { token, password, confirmPassword } = req.body;
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
    return res.status(400).json({ error: "Tautan reset password tidak valid atau kedaluwarsa." });
  }
  if (typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ error: "Password baru minimal 8 karakter." });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Konfirmasi password tidak cocok." });
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const connection = await db.getConnection();
  let transactionStarted = false;
  try {
    await connection.beginTransaction();
    transactionStarted = true;
    const [tokens] = await connection.query(
      "SELECT user_id FROM password_reset_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW() FOR UPDATE",
      [tokenHash],
    );
    if (tokens.length === 0) {
      await connection.rollback();
      transactionStarted = false;
      return res.status(400).json({ error: "Tautan reset password tidak valid atau kedaluwarsa." });
    }

    const userId = tokens[0].user_id;
    const hashedPassword = await bcrypt.hash(password, 10);
    await connection.query(
      "UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?",
      [hashedPassword, userId],
    );
    await connection.query(
      "UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL",
      [userId],
    );
    await connection.commit();
    transactionStarted = false;

    await writeAuditLog({ actorId: userId, action: "password_reset" });
    res.json({ message: "Password berhasil diperbarui. Silakan masuk dengan password baru." });
  } catch (error) {
    if (transactionStarted) await connection.rollback();
    next(error);
  } finally {
    connection.release();
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

router.post("/logout", requireAuth, async (req, res, next) => {
  try {
    await db.query("DELETE FROM auth_sessions WHERE id = ?", [req.authSessionId]);
    res.status(200).json({ message: "Logout berhasil." });
  } catch (error) {
    next(error);
  }
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