CREATE TABLE IF NOT EXISTS templates (
  id VARCHAR(255) PRIMARY KEY COMMENT 'Linked to employee_id',
  name VARCHAR(255),
  image_url LONGTEXT,
  crop_meta TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS birthday_messages (
  id VARCHAR(255) PRIMARY KEY,
  employee_id VARCHAR(255),
  author_name VARCHAR(255),
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS plantel_configs (
  plantel VARCHAR(100) PRIMARY KEY,
  recipient_emails TEXT
);