CREATE TABLE login_ip_attempts (
  ip_address VARCHAR(45) NOT NULL,
  failed_attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  window_started_at DATETIME NOT NULL,
  blocked_until DATETIME NULL,
  PRIMARY KEY (ip_address),
  KEY idx_login_ip_attempts_window (window_started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE auth_sessions (
  id CHAR(36) NOT NULL,
  subject_type ENUM('user', 'school') NOT NULL,
  subject_id VARCHAR(36) NOT NULL,
  last_activity_at DATETIME(6) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_auth_sessions_subject (subject_type, subject_id),
  KEY idx_auth_sessions_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
