CREATE TABLE password_reset_tokens (
  token_hash CHAR(64) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (token_hash),
  KEY idx_password_reset_user_created (user_id, created_at),
  CONSTRAINT fk_password_reset_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;