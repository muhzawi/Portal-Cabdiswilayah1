CREATE TABLE school_tasks (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  created_by VARCHAR(36) NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  application_id VARCHAR(255) NULL,
  target_url VARCHAR(2048) NOT NULL,
  attachment_name VARCHAR(255) NULL,
  attachment_mime VARCHAR(127) NULL,
  attachment_data MEDIUMBLOB NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_school_tasks_created (created_at),
  CONSTRAINT fk_school_tasks_creator
    FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_school_tasks_application
    FOREIGN KEY (application_id) REFERENCES applications (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE school_task_recipients (
  task_id BIGINT UNSIGNED NOT NULL,
  school_npsn CHAR(8) NOT NULL,
  status ENUM('pending', 'completed') NOT NULL DEFAULT 'pending',
  completed_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (task_id, school_npsn),
  KEY idx_school_task_recipients_school_status (school_npsn, status),
  CONSTRAINT fk_school_task_recipients_task
    FOREIGN KEY (task_id) REFERENCES school_tasks (id) ON DELETE CASCADE,
  CONSTRAINT fk_school_task_recipients_school
    FOREIGN KEY (school_npsn) REFERENCES schools (npsn) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
