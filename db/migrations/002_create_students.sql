-- 002_create_students.sql
CREATE TABLE students (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_name   VARCHAR(50) NOT NULL,
  year         INTEGER NOT NULL,
  parent_name  VARCHAR(200),
  parent_phone VARCHAR(20),
  birth_date   DATE,
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_class   ON students(class_name, year);
