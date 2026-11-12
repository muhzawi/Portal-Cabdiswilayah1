CREATE TABLE schools (
  npsn CHAR(8) NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved',
  email VARCHAR(255) NULL,
  pending_email VARCHAR(255) NULL,
  email_verified_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (npsn),
  UNIQUE KEY schools_email_unique (email),
  UNIQUE KEY schools_pending_email_unique (pending_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE school_application_access (
  school_npsn CHAR(8) NOT NULL,
  application_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (school_npsn, application_id),
  KEY idx_school_application_access_application (application_id),
  CONSTRAINT fk_school_application_school
    FOREIGN KEY (school_npsn) REFERENCES schools (npsn) ON DELETE CASCADE,
  CONSTRAINT fk_school_application_application
    FOREIGN KEY (application_id) REFERENCES applications (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE school_email_verification_tokens (
  token_hash CHAR(64) NOT NULL,
  school_npsn CHAR(8) NOT NULL,
  email VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (token_hash),
  KEY idx_school_verification_school_created (school_npsn, created_at),
  CONSTRAINT fk_school_verification_school
    FOREIGN KEY (school_npsn) REFERENCES schools (npsn) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
