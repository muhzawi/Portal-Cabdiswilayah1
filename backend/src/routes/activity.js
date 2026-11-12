import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import db from "../db.js";

const router = Router();

router.get("/", requireAuth, requireRole("superadmin", "super_user"), async (req, res, next) => {
  try {
    const [logs] = await db.query(
      `SELECT l.id, l.action, l.target_id, l.details, l.created_at,
              a.full_name AS actor_name, a.email AS actor_email,
              t.full_name AS target_name, t.email AS target_email
       FROM activity_logs l
       LEFT JOIN users a ON a.id = l.actor_id
       LEFT JOIN users t ON t.id = l.target_id
       ORDER BY l.created_at DESC
       LIMIT 200`
    );
    res.json({ logs });
  } catch (error) {
    next(error);
  }
});

export default router;