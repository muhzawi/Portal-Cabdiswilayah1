import { Router } from "express";
import db from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { writeAuditLog } from "../audit.js";

const router = Router();
const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;
const attachmentTypes = new Map([
  [".pdf", "application/pdf"],
  [".txt", "text/plain"],
  [".csv", "text/csv"],
  [".doc", "application/msword"],
  [".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  [".xls", "application/vnd.ms-excel"],
  [".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  [".ppt", "application/vnd.ms-powerpoint"],
  [".pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
]);

function isSuperUser(user) {
  return ["super_user", "superadmin"].includes(user?.role);
}

function parseAttachment(value) {
  if (value == null) return null;
  if (
    typeof value !== "object"
    || typeof value.name !== "string"
    || typeof value.mimeType !== "string"
    || typeof value.data !== "string"
    || !value.name.trim()
    || !value.data
  ) {
    return { error: "Data lampiran tidak valid." };
  }

  const name = value.name.split(/[\\/]/).pop().trim();
  const extension = name.slice(name.lastIndexOf(".")).toLowerCase();
  const expectedMimeType = attachmentTypes.get(extension);
  if (!expectedMimeType || value.mimeType !== expectedMimeType) {
    return { error: "Jenis file lampiran tidak didukung." };
  }

  const data = Buffer.from(value.data, "base64");
  if (
    data.length === 0
    || data.length > MAX_ATTACHMENT_BYTES
    || data.toString("base64") !== value.data
  ) {
    return { error: "Ukuran lampiran maksimal 2 MB atau data file tidak valid." };
  }

  return {
    name: name.slice(0, 255),
    mimeType: expectedMimeType,
    data,
  };
}

function normalizeHttpUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    if (req.user?.type === "school") {
      const [tasks] = await db.query(
        `SELECT t.id, t.title, t.description, t.target_url, t.attachment_name,
                t.created_at, a.name AS application_name,
                r.status, r.completed_at
         FROM school_task_recipients r
         INNER JOIN school_tasks t ON t.id = r.task_id
         LEFT JOIN applications a ON a.id = t.application_id
         WHERE r.school_npsn = ?
         ORDER BY (r.status = 'pending') DESC, t.created_at DESC`,
        [req.user.npsn],
      );
      return res.json({
        tasks,
        pendingCount: tasks.filter((task) => task.status === "pending").length,
      });
    }

    if (!isSuperUser(req.user)) {
      return res.status(403).json({ error: "Akses ditolak." });
    }

    const [tasks] = await db.query(
      `SELECT t.id, t.title, t.description, t.target_url, t.attachment_name,
              t.created_at, a.name AS application_name,
              COUNT(r.school_npsn) AS recipient_count,
              COALESCE(SUM(r.status = 'completed'), 0) AS completed_count
       FROM school_tasks t
       LEFT JOIN applications a ON a.id = t.application_id
       LEFT JOIN school_task_recipients r ON r.task_id = t.id
       GROUP BY t.id
       ORDER BY t.created_at DESC`,
    );
    res.json({ tasks });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/attachment", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ error: "ID tugas tidak valid." });
    }

    const schoolQuery = req.user?.type === "school";
    if (!schoolQuery && !isSuperUser(req.user)) {
      return res.status(403).json({ error: "Akses ditolak." });
    }

    const [rows] = await db.query(
      `SELECT t.attachment_name, t.attachment_mime, t.attachment_data
       FROM school_tasks t
       ${schoolQuery ? "INNER JOIN school_task_recipients r ON r.task_id = t.id" : ""}
       WHERE t.id = ? ${schoolQuery ? "AND r.school_npsn = ?" : ""}
         AND t.attachment_data IS NOT NULL`,
      schoolQuery ? [id, req.user.npsn] : [id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Lampiran tidak ditemukan." });
    }

    res.type(rows[0].attachment_mime)
      .attachment(rows[0].attachment_name)
      .send(rows[0].attachment_data);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ error: "ID tugas tidak valid." });
    }

    const schoolQuery = req.user?.type === "school";
    if (!schoolQuery && !isSuperUser(req.user)) {
      return res.status(403).json({ error: "Akses ditolak." });
    }
    const [rows] = await db.query(
      `SELECT t.id, t.title, t.description, t.target_url, t.attachment_name,
              t.attachment_mime, t.created_at, a.name AS application_name
              ${schoolQuery ? ", r.status, r.completed_at" : ""}
       FROM school_tasks t
       LEFT JOIN applications a ON a.id = t.application_id
       ${schoolQuery ? "INNER JOIN school_task_recipients r ON r.task_id = t.id" : ""}
       WHERE t.id = ? ${schoolQuery ? "AND r.school_npsn = ?" : ""}`,
      schoolQuery ? [id, req.user.npsn] : [id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Tugas tidak ditemukan." });
    }
    res.json({ task: rows[0] });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireRole("super_user"), async (req, res, next) => {
  const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
  const description = typeof req.body.description === "string"
    ? req.body.description.trim()
    : "";
  const applicationId = typeof req.body.applicationId === "string"
    ? req.body.applicationId.trim()
    : "";
  const targetUrl = req.body.targetUrl == null || req.body.targetUrl === ""
    ? null
    : normalizeHttpUrl(req.body.targetUrl);
  const attachment = parseAttachment(req.body.attachment);

  if (!title || title.length > 255) {
    return res.status(400).json({ error: "Judul tugas wajib diisi (maksimal 255 karakter)." });
  }
  if (typeof req.body.description !== "undefined" && typeof req.body.description !== "string") {
    return res.status(400).json({ error: "Deskripsi tugas tidak valid." });
  }
  if (description.length > 10000) {
    return res.status(400).json({ error: "Deskripsi tugas maksimal 10.000 karakter." });
  }
  if (req.body.targetUrl && !targetUrl) {
    return res.status(400).json({ error: "Tautan tugas harus menggunakan URL HTTP atau HTTPS yang valid." });
  }
  if (targetUrl && targetUrl.length > 2048) {
    return res.status(400).json({ error: "Tautan tugas maksimal 2.048 karakter." });
  }
  if (req.body.applicationId != null && typeof req.body.applicationId !== "string") {
    return res.status(400).json({ error: "Aplikasi tujuan tidak valid." });
  }
  if (attachment?.error) {
    return res.status(400).json({ error: attachment.error });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    let application = null;
    if (applicationId) {
      const [applications] = await connection.query(
        "SELECT id, name, url FROM applications WHERE id = ?",
        [applicationId],
      );
      application = applications[0];
      if (!application) {
        await connection.rollback();
        return res.status(400).json({ error: "Aplikasi tujuan tidak ditemukan." });
      }
    }
    if (!targetUrl && !application) {
      await connection.rollback();
      return res.status(400).json({
        error: "Pilih aplikasi tujuan atau isi tautan agar sekolah tahu ke mana harus mengerjakan tugas.",
      });
    }

    const [schools] = await connection.query(
      "SELECT npsn FROM schools WHERE status = 'approved'",
    );
    if (schools.length === 0) {
      await connection.rollback();
      return res.status(409).json({ error: "Belum ada sekolah aktif yang dapat menerima tugas." });
    }

    const finalTargetUrl = targetUrl || normalizeHttpUrl(application.url);
    if (!finalTargetUrl) {
      await connection.rollback();
      return res.status(400).json({ error: "URL aplikasi tujuan tidak valid." });
    }

    const [insertResult] = await connection.query(
      `INSERT INTO school_tasks
         (created_by, title, description, application_id, target_url,
          attachment_name, attachment_mime, attachment_data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        title,
        description || null,
        application?.id || null,
        finalTargetUrl,
        attachment?.name || null,
        attachment?.mimeType || null,
        attachment?.data || null,
      ],
    );
    const taskId = insertResult.insertId;
    await connection.query(
      "INSERT INTO school_task_recipients (task_id, school_npsn) VALUES ?",
      [schools.map(({ npsn }) => [taskId, npsn])],
    );
    await connection.commit();

    await writeAuditLog({
      actorId: req.user.id,
      action: "school_task_created",
      targetId: String(taskId),
      details: { title, recipientCount: schools.length },
    });
    res.status(201).json({
      message: `Tugas berhasil dikirim ke ${schools.length} sekolah aktif.`,
      task: { id: taskId, title, recipientCount: schools.length },
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

router.patch("/:id/complete", async (req, res, next) => {
  if (req.user?.type !== "school") {
    return res.status(403).json({ error: "Fitur ini hanya tersedia untuk akun sekolah." });
  }
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({ error: "ID tugas tidak valid." });
  }

  try {
    const [result] = await db.query(
      `UPDATE school_task_recipients
       SET status = 'completed', completed_at = NOW()
       WHERE task_id = ? AND school_npsn = ? AND status = 'pending'`,
      [id, req.user.npsn],
    );
    if (result.affectedRows === 0) {
      const [rows] = await db.query(
        "SELECT status FROM school_task_recipients WHERE task_id = ? AND school_npsn = ?",
        [id, req.user.npsn],
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: "Tugas tidak ditemukan." });
      }
      return res.status(409).json({ error: "Tugas ini sudah ditandai selesai." });
    }
    res.json({ message: "Tugas berhasil ditandai selesai." });
  } catch (error) {
    next(error);
  }
});

export default router;
