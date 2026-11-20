ALTER TABLE schools
  ADD COLUMN password_change_required TINYINT(1) NOT NULL DEFAULT 1
  AFTER password_hash,
  DROP COLUMN password_set_at;

DROP TABLE school_password_setup_tokens;
