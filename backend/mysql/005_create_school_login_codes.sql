CREATE TABLE school_login_codes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  school_npsn CHAR(8) NOT NULL,
  email VARCHAR(255) NOT NULL,
  request_ip VARCHAR(45) NOT NULL,
  code_hash CHAR(64) NOT NULL,
  failed_attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_school_login_codes_school_created (school_npsn, created_at),
  KEY idx_school_login_codes_ip_created (request_ip, created_at),
  KEY idx_school_login_codes_expiry (expires_at),
  CONSTRAINT fk_school_login_codes_school
    FOREIGN KEY (school_npsn) REFERENCES schools (npsn) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
