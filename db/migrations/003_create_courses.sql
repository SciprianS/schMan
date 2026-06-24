-- 003_create_courses.sql
CREATE TABLE courses (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(200) NOT NULL,
  professor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  semester     INTEGER NOT NULL CHECK (semester IN (1, 2)),
  year         INTEGER NOT NULL,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_courses_professor ON courses(professor_id);
CREATE INDEX idx_courses_active    ON courses(is_active, year, semester);
