-- seed.sql — Date initiale de test
-- Parola pentru toti utilizatorii: Test1234!
-- Hash generat cu bcrypt, cost factor 12

INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
(
  'admin@scoala.ro',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4oA4gDmJWe',
  'Administrator', 'Sistem', 'admin'
),
(
  'ionescu@scoala.ro',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4oA4gDmJWe',
  'Gheorghe', 'Ionescu', 'professor'
),
(
  'popa@scoala.ro',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4oA4gDmJWe',
  'Maria', 'Popa', 'professor'
),
(
  'ion.popescu@scoala.ro',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4oA4gDmJWe',
  'Ion', 'Popescu', 'student'
),
(
  'andrei.ionescu@scoala.ro',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4oA4gDmJWe',
  'Andrei', 'Ionescu', 'student'
);

-- Profile elevi
INSERT INTO students (user_id, class_name, year, parent_name, parent_phone) VALUES
(4, '10A', 2025, 'Maria Popescu',  '0722000001'),
(5, '10A', 2025, 'Elena Ionescu',  '0722000002');

-- Cursuri
INSERT INTO courses (name, professor_id, semester, year) VALUES
('Matematica', 2, 1, 2025),
('Fizica',     3, 1, 2025),
('Informatica',2, 1, 2025);

-- Note
INSERT INTO grades (student_id, course_id, professor_id, value, description) VALUES
(4, 1, 2, 8.50, 'Teza semestrul I'),
(4, 2, 3, 7.00, 'Lucrare practica'),
(5, 1, 2, 9.00, 'Teza semestrul I'),
(5, 3, 2, 6.50, 'Test unitate');
