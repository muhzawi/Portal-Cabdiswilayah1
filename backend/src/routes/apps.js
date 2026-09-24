import { Router } from "express";
import { requireApplicationAccess, requireAuth, requireRole } from "../middleware/auth.js";
import db from "../db.js";
import { writeAuditLog } from "../audit.js";

const router = Router();

// GET /api/public-apps (Public)
router.get("/public-apps", async (_req, res, next) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, category, description, status, version, url FROM applications ORDER BY name ASC"
    );
    res.json({ applications: rows });
  } catch (error) {
    next(error);
  }
});

// GET /api/apps (Protected)
router.get("/apps", requireAuth, async (req, res, next) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;

    if (["super_user", "superadmin", "admin"].includes(userRole)) {
      const [rows] = await db.query(
        "SELECT id, name, category, description, status, version, url FROM applications ORDER BY name ASC"
      );
      return res.json({ applications: rows });
    }

    // Untuk medium_user, ambil hanya aplikasi yang diizinkan
    const sql = `
      SELECT a.id, a.name, a.category, a.description, a.status, a.version, a.url 
      FROM applications a
      INNER JOIN user_application_access uaa ON a.id = uaa.application_id
      WHERE uaa.user_id = ?
      ORDER BY a.name ASC
    `;
    const [rows] = await db.query(sql, [userId]);
    res.json({ applications: rows });
  } catch (error) {
    next(error);
  }
});

// GET /api/apps/:id
router.get("/apps/:id", requireAuth, requireApplicationAccess, async (req, res, next) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, category, description, status, version, url FROM applications WHERE id = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Aplikasi tidak ditemukan." });
    }

    res.json({ application: rows[0] });
  } catch (error) {
    next(error);
  }
});

// GET /api/apps/:id/redirect
router.get("/apps/:id/redirect", requireAuth, requireApplicationAccess, async (req, res, next) => {
  try {
    const [rows] = await db.query(
      "SELECT url, status FROM applications WHERE id = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Aplikasi tidak ditemukan." });
    }

    const app = rows[0];
    if (app.status !== "available") {
      return res.status(409).json({ error: "Aplikasi sedang tidak tersedia." });
    }

    res.json({ url: app.url });
  } catch (error) {
    next(error);
  }
});

// POST /api/apps (Admin dan Super Admin)
router.post("/apps", requireAuth, requireRole("admin", "superadmin", "super_user"), async (req, res, next) => {
  try {
    const { name, category, description, status, version, url, id } = req.body;

    if (!name?.trim()) return res.status(400).json({ error: "Nama aplikasi wajib diisi." });
    if (!category?.trim()) return res.status(400).json({ error: "Kategori aplikasi wajib diisi." });
    if (!url || !/^https?:\/\//.test(url.trim())) {
      return res.status(400).json({ error: "URL aplikasi wajib diawali http:// atau https://" });
    }

    const generatedId =
      id?.trim() ||
      name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    const appId = generatedId || `app-${Date.now()}`;
    const appName = name.trim();
    const appCategory = category.trim();
    const appDescription = description ? description.trim() : "";
    const appStatus = ["available", "maintenance", "offline"].includes(status) ? status : "available";
    const appVersion = version ? version.trim() : "1.0.0";
    const appUrl = url.trim();

    // Cek duplikasi ID
    const [existing] = await db.query("SELECT id FROM applications WHERE id = ?", [appId]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Aplikasi dengan ID / nama tersebut sudah terdaftar." });
    }

    await db.query(
      "INSERT INTO applications (id, name, category, description, status, version, url) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [appId, appName, appCategory, appDescription, appStatus, appVersion, appUrl]
    );
    await writeAuditLog({ actorId: req.user.id, action: "application_created", targetId: null, details: { appId, appName } });

    const newApp = {
      id: appId,
      name: appName,
      category: appCategory,
      description: appDescription,
      status: appStatus,
      version: appVersion,
      url: appUrl,
    };

    res.status(201).json({ message: `Aplikasi ${appName} berhasil ditambahkan!`, application: newApp });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/apps/:id (Super User Only)
router.patch("/apps/:id", requireAuth, requireRole("super_user"), async (req, res, next) => {
  try {
    const allowed = ["name", "category", "description", "status", "version", "url"];
    const updates = [];
    const values = [];

    Object.entries(req.body).forEach(([key, val]) => {
      if (allowed.includes(key)) {
        updates.push(`${key} = ?`);
        values.push(val);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ error: "Tidak ada data yang diperbarui." });
    }

    values.push(req.params.id);
    const sql = `UPDATE applications SET ${updates.join(", ")} WHERE id = ?`;

    const [result] = await db.query(sql, values);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Aplikasi tidak ditemukan." });
    }

    const [rows] = await db.query("SELECT * FROM applications WHERE id = ?", [req.params.id]);
    res.json({ application: rows[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/apps/:id (Super User Only)
router.delete("/apps/:id", requireAuth, requireRole("super_user"), async (req, res, next) => {
  try {
    const appId = req.params.id;

    // Hapus relasi di user_application_access terlebih dahulu
    await db.query("DELETE FROM user_application_access WHERE application_id = ?", [appId]);

    const [result] = await db.query("DELETE FROM applications WHERE id = ?", [appId]);
    if (result.affectedRows === 0) {
      return res.status(400).json({ error: "Gagal menghapus aplikasi atau aplikasi tidak ditemukan." });
    }

    res.json({ message: `Aplikasi dengan ID ${appId} berhasil dihapus dari portal.`, appId });
  } catch (err) {
    next(err);
  }
});

export default router;