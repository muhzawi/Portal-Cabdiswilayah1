import db from "../db.js";

const MAX_FAILED_ATTEMPTS = 5;

export function getClientIp(req) {
  return req.ip || req.socket.remoteAddress || "unknown";
}

export async function isLoginIpBlocked(ip) {
  const [rows] = await db.query(
    "SELECT blocked_until > NOW() AS is_blocked FROM login_ip_attempts WHERE ip_address = ?",
    [ip],
  );
  return Boolean(rows[0]?.is_blocked);
}

export async function recordFailedLogin(ip) {
  await db.query(
    `INSERT INTO login_ip_attempts (ip_address, failed_attempts, window_started_at, blocked_until)
     VALUES (?, 1, NOW(), NULL)
     ON DUPLICATE KEY UPDATE
       blocked_until = CASE
         WHEN window_started_at <= DATE_SUB(NOW(), INTERVAL 10 MINUTE) THEN NULL
         WHEN failed_attempts >= ? THEN DATE_ADD(NOW(), INTERVAL 10 MINUTE)
         ELSE NULL
       END,
       failed_attempts = CASE
         WHEN window_started_at <= DATE_SUB(NOW(), INTERVAL 10 MINUTE) THEN 1
         ELSE failed_attempts + 1
       END,
       window_started_at = CASE
         WHEN window_started_at <= DATE_SUB(NOW(), INTERVAL 10 MINUTE) THEN NOW()
         ELSE window_started_at
       END`,
    [ip, MAX_FAILED_ATTEMPTS - 1],
  );
  await db.query(
    "DELETE FROM login_ip_attempts WHERE window_started_at < DATE_SUB(NOW(), INTERVAL 1 DAY) AND (blocked_until IS NULL OR blocked_until < NOW())",
  );
  return isLoginIpBlocked(ip);
}

export async function clearLoginFailures(ip) {
  await db.query(
    "UPDATE login_ip_attempts SET failed_attempts = 0, blocked_until = NULL, window_started_at = NOW() WHERE ip_address = ?",
    [ip],
  );
}
