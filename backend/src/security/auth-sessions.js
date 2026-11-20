import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import db from "../db.js";
import { JWT_SECRET } from "../config/jwt.js";

export async function createAuthSessionToken(claims, subjectType, subjectId) {
  const sessionId = randomUUID();
  await db.query(
    "INSERT INTO auth_sessions (id, subject_type, subject_id, last_activity_at, expires_at) VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 24 HOUR))",
    [sessionId, subjectType, subjectId],
  );
  return jwt.sign({ ...claims, sid: sessionId }, JWT_SECRET, { expiresIn: "24h" });
}
