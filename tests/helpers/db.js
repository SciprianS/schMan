const bcrypt = require('bcryptjs');
const db = require('../../src/config/database');

async function seedTestData() {
  const hash = await bcrypt.hash('Test1234!', 10);

  // Curata datele in ordine corecta (respecta foreign keys)
  await db.query('DELETE FROM audit_logs');
  await db.query('DELETE FROM grades');
  await db.query('DELETE FROM students');
  await db.query('DELETE FROM courses');
  // Sterge doar utilizatorii de test, nu pe toti
  await db.query("DELETE FROM users WHERE email LIKE '%@test.ro'");

  // Insereaza utilizatorii si retine ID-urile generate automat
  const admin = await db.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role)
     VALUES ('admin@test.ro', $1, 'Admin', 'Test', 'admin')
     RETURNING id`,
    [hash],
  );
  const prof1 = await db.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role)
     VALUES ('prof1@test.ro', $1, 'Profesor1', 'Test', 'professor')
     RETURNING id`,
    [hash],
  );
  const stud1 = await db.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role)
     VALUES ('stud1@test.ro', $1, 'Student1', 'Test', 'student')
     RETURNING id`,
    [hash],
  );
  const stud2 = await db.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role)
     VALUES ('stud2@test.ro', $1, 'Student2', 'Test', 'student')
     RETURNING id`,
    [hash],
  );
  const prof2 = await db.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role)
     VALUES ('prof2@test.ro', $1, 'Profesor2', 'Test', 'professor')
     RETURNING id`,
    [hash],
  );

  // Retine ID-urile reale
  const IDS = {
    admin: admin.rows[0].id,
    prof1: prof1.rows[0].id,
    stud1: stud1.rows[0].id,
    stud2: stud2.rows[0].id,
    prof2: prof2.rows[0].id,
  };

  // Insereaza profilurile de elev
  const student1 = await db.query(
    `INSERT INTO students (user_id, class_name, year)
     VALUES ($1, '10A', 2025) RETURNING id`,
    [IDS.stud1],
  );
  const student2 = await db.query(
    `INSERT INTO students (user_id, class_name, year)
     VALUES ($1, '10A', 2025) RETURNING id`,
    [IDS.stud2],
  );

  IDS.student1 = student1.rows[0].id;
  IDS.student2 = student2.rows[0].id;

  // Insereaza cursuri
  const course1 = await db.query(
    `INSERT INTO courses (name, professor_id, semester, year)
     VALUES ('Matematica', $1, 1, 2025) RETURNING id`,
    [IDS.prof1],
  );
  const course2 = await db.query(
    `INSERT INTO courses (name, professor_id, semester, year)
     VALUES ('Fizica', $1, 1, 2025) RETURNING id`,
    [IDS.prof2],
  );

  IDS.course1 = course1.rows[0].id;
  IDS.course2 = course2.rows[0].id;

  // Insereaza note
  // Nota 1: stud1 + course1 + prof1
  const grade1 = await db.query(
    `INSERT INTO grades (student_id, course_id, professor_id, value)
     VALUES ($1, $2, $3, 8.50) RETURNING id`,
    [IDS.stud1, IDS.course1, IDS.prof1],
  );
  // Nota 2: stud2 + course1 + prof1
  const grade2 = await db.query(
    `INSERT INTO grades (student_id, course_id, professor_id, value)
     VALUES ($1, $2, $3, 7.00) RETURNING id`,
    [IDS.stud2, IDS.course1, IDS.prof1],
  );
  // Nota 3: stud1 + course2 + prof2
  const grade3 = await db.query(
    `INSERT INTO grades (student_id, course_id, professor_id, value)
     VALUES ($1, $2, $3, 9.00) RETURNING id`,
    [IDS.stud1, IDS.course2, IDS.prof2],
  );

  IDS.grade1 = grade1.rows[0].id;
  IDS.grade2 = grade2.rows[0].id;
  IDS.grade3 = grade3.rows[0].id;

  // Salveaza ID-urile intr-un loc accesibil testelor
  global.__TEST_IDS__ = IDS;

  return IDS;
}

async function clearTestData() {
  await db.query('DELETE FROM audit_logs');
  await db.query('DELETE FROM grades');
  await db.query('DELETE FROM students');
  await db.query('DELETE FROM courses');
  await db.query("DELETE FROM users WHERE email LIKE '%@test.ro'");
}

module.exports = { seedTestData, clearTestData };
