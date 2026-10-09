import jwt from "jsonwebtoken";
import db from "../db.js";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

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
    const [rows] = await db.query(
      "SELECT id, full_name, email, role, status FROM users WHERE id = ?",
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

  // Cek akses via database MySQL
  try {
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