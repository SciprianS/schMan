-- 004_create_grades.sql
CREATE TABLE grades (
  id           SERIAL PRIMARY KEY,
  student_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id    INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  professor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  value        DECIMAL(4,2) NOT NULL CHECK (value >= 1 AND value <= 10),
  grade_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  description  TEXT,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_grades_student   ON grades(student_id);
CREATE INDEX idx_grades_course    ON grades(course_id);
CREATE INDEX idx_grades_professor ON grades(professor_id);
