import jwt from "jsonwebtoken";
import db from "../db.js";
import { JWT_SECRET } from "../config/jwt.js";

export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Sesi tidak valid atau token tidak ditemukan." });
  }

  const token = authHeader.split(" ")[1];
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: "Token kadaluarsa atau tidak valid." });
  }

  try {
    const isSchool = decoded.type === "school";
    const subjectId = isSchool ? decoded.npsn : decoded.id;
    if (typeof decoded.sid !== "string" || typeof subjectId !== "string") {
      return res.status(401).json({ error: "Sesi tidak valid. Silakan masuk kembali." });
    }

    const [sessionResult] = await db.query(
      `UPDATE auth_sessions
       SET last_activity_at = GREATEST(NOW(6), DATE_ADD(last_activity_at, INTERVAL 1 MICROSECOND))
       WHERE id = ? AND subject_type = ? AND subject_id = ?
         AND last_activity_at >= DATE_SUB(NOW(6), INTERVAL 10 MINUTE)
         AND expires_at > NOW()`,
      [decoded.sid, isSchool ? "school" : "user", subjectId],
    );
    if (sessionResult.affectedRows === 0) {
      return res.status(401).json({ error: "Sesi berakhir karena tidak aktif. Silakan masuk kembali." });
    }
    req.authSessionId = decoded.sid;

    if (isSchool) {
      const [schools] = await db.query(
        "SELECT npsn, name, email, status, email_verified_at FROM schools WHERE npsn = ?",
        [decoded.npsn],
      );
      const school = schools[0];
      if (!school || school.status === "rejected") {
        return res.status(401).json({ error: "Akun sekolah tidak tersedia." });
      }

      req.user = {
        id: school.npsn,
        npsn: school.npsn,
        name: school.name,
        email: school.email,
        role: "school_user",
        type: "school",
        status: school.status,
        emailVerified: Boolean(school.email_verified_at),
      };
      return next();
    }

    const [rows] = await db.query(
      "SELECT id, full_name, email, role, status, institution, nip FROM users WHERE id = ?",
      [decoded.id],
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: "Pengguna tidak ditemukan." });
    }
    req.user = { ...decoded, ...rows[0] };
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (...roles) => {
  const allowedRoles = new Set(roles.flatMap((role) => {
    if (role === "super_user") return ["super_user", "superadmin"];
    if (role === "medium_user") return ["medium_user", "staff"];
    return [role];
  }));
  return (req, res, next) => {
    if (!req.user || !allowedRoles.has(req.user.role)) {
      return res.status(403).json({ error: "Akses ditolak. Anda tidak memiliki izin." });
    }
    next();
  };
};

export const requireApplicationAccess = async (req, res, next) => {
  if (["super_user", "superadmin", "admin"].includes(req.user?.role)) return next();

  try {
    if (req.user?.type === "school") {
      if (req.user.status !== "approved" || !req.user.emailVerified) {
        return res.status(403).json({
          error: "Verifikasi email dan persetujuan admin diperlukan sebelum membuka aplikasi.",
        });
      }
      const [rows] = await db.query(
        "SELECT application_id FROM school_application_access WHERE school_npsn = ? AND application_id = ?",
        [req.user.npsn, req.params.id],
      );
      if (rows.length === 0) {
        return res.status(403).json({ error: "Sekolah Anda tidak memiliki akses ke aplikasi ini." });
      }
      return next();
    }

    const [rows] = await db.query(
      "SELECT * FROM user_application_access WHERE user_id = ? AND application_id = ?",
      [req.user.id, req.params.id]
    );
    if (rows.length === 0) {
      return res.status(403).json({ error: "Anda tidak memiliki akses ke aplikasi ini." });
    }
    next();
  } catch (error) {
    next(error);
  }
};