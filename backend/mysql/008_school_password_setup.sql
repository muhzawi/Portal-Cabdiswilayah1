UPDATE school_login_codes
SET used_at = NOW()
WHERE used_at IS NULL;

DELETE FROM auth_sessions
WHERE subject_type = 'school';

ALTER TABLE schools
  ADD COLUMN password_set_at DATETIME NULL AFTER password_hash;

CREATE TABLE school_password_setup_tokens (
  token_hash CHAR(64) NOT NULL,
  school_npsn CHAR(8) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (token_hash),
  KEY idx_school_password_setup_school_created (school_npsn, created_at),
  CONSTRAINT fk_school_password_setup_school
    FOREIGN KEY (school_npsn) REFERENCES schools (npsn) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
