import { Router } from "express";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import db from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { writeAuditLog } from "../audit.js";
import { isSmtpConfigured, sendSchoolAccountCreatedEmail } from "../email.js";

const router = Router();

router.use(requireAuth, requireRole("super_user"));

router.get("/", async (_req, res, next) => {
  try {
    const [schools] = await db.query(
      "SELECT npsn, name, email, phone, email_verified_at, status, created_at, updated_at FROM schools ORDER BY created_at DESC",
    );
    const [accessRows] = await db.query(
      "SELECT school_npsn, application_id FROM school_application_access",
    );
    const accessMap = new Map();
    for (const row of accessRows) {
      const appAccess = accessMap.get(row.school_npsn) || [];
      appAccess.push(row.application_id);
      accessMap.set(row.school_npsn, appAccess);
    }

    res.json({
      schools: schools.map(({ email_verified_at, ...school }) => ({
        ...school,
        email_verified: Boolean(email_verified_at),
        app_access: accessMap.get(school.npsn) || [],
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  const npsn = typeof req.body.npsn === "string" ? req.body.npsn.trim() : "";
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const phone = typeof req.body.phone === "string" ? req.body.phone.trim() : "";
  if (!/^\d{8}$/.test(npsn)) {
    return res.status(400).json({ error: "NPSN harus berupa 8 digit angka." });
  }
  if (!name) {
    return res.status(400).json({ error: "Nama sekolah wajib diisi." });
  }
  if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Alamat email sekolah tidak valid." });
  }
  const phoneDigits = phone.replace(/\D/g, "");
  if (
    phone.length > 30
    || !/^\+?[0-9][0-9\s()-]*$/.test(phone)
    || phoneDigits.length < 8
    || phoneDigits.length > 15
  ) {
    return res.status(400).json({ error: "Nomor telepon harus berisi 8-15 digit yang valid." });
  }
  if (!isSmtpConfigured()) {
    return res.status(503).json({
      error: "Layanan email belum dikonfigurasi. Akun belum dibuat; hubungi administrator portal.",
    });
  }

  const connection = await db.getConnection();
  let educationApps;
  try {
    await connection.beginTransaction();
    const [existing] = await connection.query(
      "SELECT npsn FROM schools WHERE npsn = ?",
      [npsn],
    );
    if (existing.length > 0) {
      await connection.rollback();
      return res.status(409).json({ error: "NPSN sudah terdaftar di sistem." });
    }

    const [existingEmails] = await connection.query(
      "SELECT npsn FROM schools WHERE email = ? OR pending_email = ? LIMIT 1",
      [email, email],
    );
    if (existingEmails.length > 0) {
      await connection.rollback();
      return res.status(409).json({ error: "Email sudah digunakan oleh sekolah lain." });
    }

    const passwordHash = await bcrypt.hash(randomUUID(), 10);
    await connection.query(
      "INSERT INTO schools (npsn, name, password_hash, status, email, phone) VALUES (?, ?, ?, 'approved', ?, ?)",
      [npsn, name, passwordHash, email, phone],
    );
    [educationApps] = await connection.query(
      "SELECT id FROM applications WHERE LOWER(category) = 'pendidikan'",
    );
    if (educationApps.length > 0) {
      await connection.query(
        "INSERT INTO school_application_access (school_npsn, application_id) VALUES ?",
        [educationApps.map(({ id }) => [npsn, id])],
      );
    }
    await connection.commit();

    await writeAuditLog({
      actorId: req.user.id,
      action: "school_created",
      details: { name, npsn },
    });

    let notificationSent = true;
    let message = `Akun sekolah ${name} berhasil dibuat. Email pemberitahuan dikirim ke alamat sekolah.`;
    try {
      const loginUrl = new URL("/login", process.env.FRONTEND_URL || "http://localhost:5173");
      await sendSchoolAccountCreatedEmail({
        to: email,
        schoolName: name,
        npsn,
        loginUrl: loginUrl.toString(),
      });
    } catch (error) {
      notificationSent = false;
      message = "Akun sekolah berhasil dibuat, tetapi email pemberitahuan gagal dikirim. Periksa konfigurasi SMTP.";
      console.error("Email pemberitahuan akun sekolah gagal dikirim:", error.message);
    }

    res.status(201).json({
      message,
      notificationSent,
      school: {
        npsn,
        name,
        email,
        phone,
        status: "approved",
        app_access: educationApps.map(({ id }) => id),
      },
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

router.patch("/:npsn", async (req, res, next) => {
  const { npsn } = req.params;
  const updates = [];
  const values = [];
  if (typeof req.body.name === "string") {
    const name = req.body.name.trim();
    if (!name) return res.status(400).json({ error: "Nama sekolah wajib diisi." });
    updates.push("name = ?");
    values.push(name);
  }
  if (req.body.status !== undefined) {
    if (!["pending", "approved", "rejected"].includes(req.body.status)) {
      return res.status(400).json({ error: "Status sekolah tidak valid." });
    }
    updates.push("status = ?");
    values.push(req.body.status);
  }
  if (!/^\d{8}$/.test(npsn) || updates.length === 0) {
    return res.status(400).json({ error: "Data perubahan sekolah tidak valid." });
  }

  try {
    values.push(npsn);
    const [result] = await db.query(
      `UPDATE schools SET ${updates.join(", ")} WHERE npsn = ?`,
      values,
    );
    if (result.affectedRows === 0) {
      const [existing] = await db.query("SELECT npsn FROM schools WHERE npsn = ?", [npsn]);
      if (existing.length === 0) {
        return res.status(404).json({ error: "Sekolah tidak ditemukan." });
      }
    }
    const [rows] = await db.query(
      "SELECT npsn, name, status, created_at, updated_at FROM schools WHERE npsn = ?",
      [npsn],
    );
    await writeAuditLog({
      actorId: req.user.id,
      action: "school_updated",
      details: req.body,
    });
    res.json({ message: "Data sekolah berhasil diperbarui.", school: rows[0] });
  } catch (error) {
    next(error);
  }
});

router.patch("/:npsn/reset-password", async (req, res, next) => {
  const { npsn } = req.params;
  const password = req.body.password;
  if (!/^\d{8}$/.test(npsn)) {
    return res.status(400).json({ error: "NPSN tidak valid." });
  }
  if (typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ error: "Password baru minimal 6 karakter." });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      "UPDATE schools SET password_hash = ? WHERE npsn = ?",
      [passwordHash, npsn],
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Sekolah tidak ditemukan." });
    }
    await writeAuditLog({
      actorId: req.user.id,
      action: "school_password_reset",
      details: { npsn },
    });
    res.json({ message: "Password sekolah berhasil direset." });
  } catch (error) {
    next(error);
  }
});

router.delete("/:npsn", async (req, res, next) => {
  const { npsn } = req.params;
  if (!/^\d{8}$/.test(npsn)) {
    return res.status(400).json({ error: "NPSN tidak valid." });
  }
  try {
    const [rows] = await db.query("SELECT name FROM schools WHERE npsn = ?", [npsn]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Sekolah tidak ditemukan." });
    }
    await db.query("DELETE FROM schools WHERE npsn = ?", [npsn]);
    await writeAuditLog({
      actorId: req.user.id,
      action: "school_deleted",
      details: { npsn },
    });
    res.json({ message: `Akun sekolah ${rows[0].name} berhasil dihapus.` });
  } catch (error) {
    next(error);
  }
});

router.put("/:npsn/app-access", async (req, res, next) => {
  const { npsn } = req.params;
  const { applicationIds } = req.body;
  if (
    !/^\d{8}$/.test(npsn) ||
    !Array.isArray(applicationIds) ||
    applicationIds.some((id) => typeof id !== "string")
  ) {
    return res.status(400).json({ error: "applicationIds harus berupa array string." });
  }

  const uniqueIds = [...new Set(applicationIds)];
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [schools] = await connection.query(
      "SELECT npsn FROM schools WHERE npsn = ?",
      [npsn],
    );
    if (schools.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Sekolah tidak ditemukan." });
    }
    if (uniqueIds.length > 0) {
      const [apps] = await connection.query(
        "SELECT id FROM applications WHERE id IN (?)",
        [uniqueIds],
      );
      if (apps.length !== uniqueIds.length) {
        await connection.rollback();
        return res.status(400).json({ error: "Satu atau beberapa aplikasi tidak ditemukan." });
      }
    }
    await connection.query(
      "DELETE FROM school_application_access WHERE school_npsn = ?",
      [npsn],
    );
    if (uniqueIds.length > 0) {
      await connection.query(
        "INSERT INTO school_application_access (school_npsn, application_id) VALUES ?",
        [uniqueIds.map((id) => [npsn, id])],
      );
    }
    await connection.commit();

    await writeAuditLog({
      actorId: req.user.id,
      action: "school_app_access_changed",
      details: { applicationIds: uniqueIds },
    });
    res.json({ npsn, applicationIds: uniqueIds });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

export default router;
