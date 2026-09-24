import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import db from "../db.js";
import { writeAuditLog } from "../audit.js";

const router = Router();

// Middleware gabungan untuk proteksi Super User
router.use(requireAuth, requireRole("superadmin", "admin", "super_user"));

// GET /api/users
router.get("/", async (_req, res, next) => {
  try {
    // 1. Ambil semua data pengguna dari MySQL
    const [users] = await db.query(
      "SELECT id, full_name, email, role, status, created_at, updated_at FROM users ORDER BY created_at DESC"
    );

    // 2. Ambil data akses aplikasi
    const [accessRows] = await db.query(
      "SELECT user_id, application_id FROM user_application_access"
    );

    // Pemetaan hak akses aplikasi per user_id
    const accessMap = new Map();
    accessRows.forEach((row) => {
      if (!accessMap.has(row.user_id)) accessMap.set(row.user_id, []);
      accessMap.get(row.user_id).push(row.application_id);
    });

    // Format output
    const formattedUsers = users.map((u) => ({
      id: u.id,
      full_name: u.full_name || "Tanpa Nama",
      email: u.email || "-",
      role: u.role || "medium_user",
      status: u.status || "approved",
      app_access: accessMap.get(u.id) || [],
      created_at: u.created_at,
      updated_at: u.updated_at,
    }));

    res.json({ users: formattedUsers });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:id
router.get("/:id", async (req, res, next) => {
  try {
    const userId = req.params.id;

    // 1. Ambil data user
    const [userRows] = await db.query(
      "SELECT id, full_name, email, role, status, created_at, updated_at FROM users WHERE id = ?",
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ error: "Pengguna tidak ditemukan." });
    }

    const user = userRows[0];

    // 2. Ambil daftar aplikasi yang diakses user tersebut
    const [accessRows] = await db.query(
      "SELECT application_id FROM user_application_access WHERE user_id = ?",
      [userId]
    );

    res.json({
      user: {
        id: user.id,
        full_name: user.full_name || "Tanpa Nama",
        email: user.email || "-",
        role: user.role || "medium_user",
        status: user.status || "approved",
        app_access: accessRows.map((row) => row.application_id),
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });
    await writeAuditLog({ actorId: req.user.id, action: "user_approved", targetId: userId });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/users/:id/approve
router.patch("/:id/approve", async (req, res, next) => {
  try {
    const userId = req.params.id;

    const [result] = await db.query(
      "UPDATE users SET status = 'approved', updated_at = NOW() WHERE id = ?",
      [userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Pengguna tidak ditemukan." });
    }

    const [updatedRows] = await db.query(
      "SELECT id, full_name, email, role, status, created_at, updated_at FROM users WHERE id = ?",
      [userId]
    );

    res.json({
      message: "Akun pengguna berhasil disetujui (Approved).",
      user: updatedRows[0],
    });
    await writeAuditLog({ actorId: req.user.id, action: "user_rejected", targetId: userId });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/users/:id/reject
router.patch("/:id/reject", async (req, res, next) => {
  try {
    const userId = req.params.id;

    const [result] = await db.query(
      "UPDATE users SET status = 'rejected', updated_at = NOW() WHERE id = ?",
      [userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Pengguna tidak ditemukan." });
    }

    const [updatedRows] = await db.query(
      "SELECT id, full_name, email, role, status, created_at, updated_at FROM users WHERE id = ?",
      [userId]
    );

    res.json({
      message: "Akun pengguna telah ditolak (Rejected).",
      user: updatedRows[0],
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/users/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const targetId = req.params.id;
    if (targetId === req.user.id) {
      return res.status(400).json({ error: "Anda tidak dapat menghapus akun Anda sendiri." });
    }

    // Hapus data akses aplikasi milik user terlebih dahulu (Foreign Key constraint)
    await db.query("DELETE FROM user_application_access WHERE user_id = ?", [targetId]);

    // Hapus user dari tabel users
    const [result] = await db.query("DELETE FROM users WHERE id = ?", [targetId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Pengguna tidak ditemukan." });
    }

    res.json({ message: "Akun pengguna berhasil dihapus secara permanen.", userId: targetId });
    await writeAuditLog({ actorId: req.user.id, action: "user_deleted", targetId });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/users/:id/role
router.patch("/:id/role", async (req, res, next) => {
  try {
    if (!["superadmin", "super_user"].includes(req.user.role)) {
      return res.status(403).json({ error: "Hanya Super Admin yang dapat mengubah role." });
    }
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: "Role akun Super Admin yang sedang digunakan tidak dapat diubah." });
    }
    const { role } = req.body;
    if (!["admin", "staff"].includes(role)) {
      return res.status(400).json({ error: "Role tidak valid." });
    }

    const [result] = await db.query(
      "UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?",
      [role, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Pengguna tidak ditemukan." });
    }

    const [rows] = await db.query(
      "SELECT id, full_name, role, status, updated_at FROM users WHERE id = ?",
      [req.params.id]
    );

    res.json({ user: rows[0] });
    await writeAuditLog({ actorId: req.user.id, action: "role_changed", targetId: req.params.id, details: { role } });
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/:id/app-access
router.put("/:id/app-access", async (req, res, next) => {
  const connection = await db.getConnection(); // Gunakan transaksi database agar sinkron
  try {
    const { applicationIds } = req.body;
    const userId = req.params.id;

    if (!Array.isArray(applicationIds) || applicationIds.some((id) => typeof id !== "string")) {
      return res.status(400).json({ error: "applicationIds harus berupa array string." });
    }

    // Mulai transaksi
    await connection.beginTransaction();

    // 1. Cek keberadaan user
    const [userRows] = await connection.query("SELECT id FROM users WHERE id = ?", [userId]);
    if (userRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Pengguna tidak ditemukan." });
    }

    // 2. Hapus seluruh hak akses aplikasi yang ada untuk user ini
    await connection.query("DELETE FROM user_application_access WHERE user_id = ?", [userId]);

    // 3. Masukkan hak akses aplikasi yang baru
    if (applicationIds.length > 0) {
      const insertValues = applicationIds.map((appId) => [userId, appId]);
      await connection.query(
        "INSERT INTO user_application_access (user_id, application_id) VALUES ?",
        [insertValues]
      );
    }

    // Commit transaksi
    await connection.commit();

    res.json({ userId, applicationIds });
    await writeAuditLog({ actorId: req.user.id, action: "app_access_changed", targetId: userId, details: { applicationIds } });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

export default router;