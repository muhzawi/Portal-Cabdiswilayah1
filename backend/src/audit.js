import db from "./db.js";

export async function writeAuditLog({ actorId, action, targetId = null, details = null }) {
  try {
    await db.query(
      "INSERT INTO activity_logs (actor_id, action, target_id, details) VALUES (?, ?, ?, ?)",
      [actorId || null, action, targetId, details ? JSON.stringify(details) : null]
    );
  } catch (error) {
    // Audit logging must not make a valid authentication or admin action fail.
    console.error("Audit log gagal disimpan:", error.message);
  }
}