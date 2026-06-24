-- 005_create_audit_logs.sql
CREATE TABLE audit_logs (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  user_role     VARCHAR(50),
  action        VARCHAR(50)  NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id   INTEGER,
  old_value     JSONB,
  new_value     JSONB,
  ip_address    VARCHAR(45),
  status        VARCHAR(20)  NOT NULL DEFAULT 'SUCCESS',
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_user_id  ON audit_logs(user_id);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_created  ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_status   ON audit_logs(status);
