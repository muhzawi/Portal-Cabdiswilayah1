import jwt from "jsonwebtoken";
import db from "../db.js";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Sesi tidak valid atau token tidak ditemukan." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Berisi data user dari token ({ id, email, role, status })
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token kadaluarsa atau tidak valid." });
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
  if (["super_user", "superadmin"].includes(req.user?.role)) return next();

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