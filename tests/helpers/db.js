const bcrypt = require('bcryptjs');
const db = require('../../src/config/database');

async function seedTestData() {
  const hash = await bcrypt.hash('Test1234!', 10);

  // Curata datele in ordine corecta
  await db.query('DELETE FROM audit_logs');
  //await db.query('DELETE FROM grades');
  //await db.query('DELETE FROM students');
  //await db.query('DELETE FROM courses');
  await db.query("DELETE FROM users WHERE email LIKE '%@test.ro'");

  // Insereaza utilizatori si retine ID-urile generate de PostgreSQL
  const admin = await db.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role)
     VALUES ('admin@test.ro', $1, 'Admin', 'Test', 'admin') RETURNING id`,
    [hash],
  );
  const prof1 = await db.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role)
     VALUES ('prof1@test.ro', $1, 'Profesor1', 'Test', 'professor') RETURNING id`,
    [hash],
  );
  const stud1 = await db.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role)
     VALUES ('stud1@test.ro', $1, 'Student1', 'Test', 'student') RETURNING id`,
    [hash],
  );
  const stud2 = await db.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role)
     VALUES ('stud2@test.ro', $1, 'Student2', 'Test', 'student') RETURNING id`,
    [hash],
  );
  const prof2 = await db.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role)
     VALUES ('prof2@test.ro', $1, 'Profesor2', 'Test', 'professor') RETURNING id`,
    [hash],
  );

  const IDS = {
    admin: admin.rows[0].id,
    prof1: prof1.rows[0].id,
    stud1: stud1.rows[0].id,
    stud2: stud2.rows[0].id,
    prof2: prof2.rows[0].id,
  };

  // Profile elevi
  const s1 = await db.query(
    `INSERT INTO students (user_id, class_name, year)
     VALUES ($1, '10A', 2025) RETURNING id`,
    [IDS.stud1],
  );
  const s2 = await db.query(
    `INSERT INTO students (user_id, class_name, year)
     VALUES ($1, '10A', 2025) RETURNING id`,
    [IDS.stud2],
  );
  IDS.student1 = s1.rows[0].id;
  IDS.student2 = s2.rows[0].id;

  // Cursuri
  const c1 = await db.query(
    `INSERT INTO courses (name, professor_id, semester, year)
     VALUES ('Matematica', $1, 1, 2025) RETURNING id`,
    [IDS.prof1],
  );
  const c2 = await db.query(
    `INSERT INTO courses (name, professor_id, semester, year)
     VALUES ('Fizica', $1, 1, 2025) RETURNING id`,
    [IDS.prof2],
  );
  IDS.course1 = c1.rows[0].id;
  IDS.course2 = c2.rows[0].id;

  // Note
  // grade1: stud1 + course1 + prof1  (stud1 il poate citi, stud2 nu)
  // grade2: stud2 + course1 + prof1  (stud2 il poate citi, stud1 nu)
  // grade3: stud1 + course2 + prof2  (prof1 nu il poate modifica)
  const g1 = await db.query(
    `INSERT INTO grades (student_id, course_id, professor_id, value)
     VALUES ($1, $2, $3, 8.50) RETURNING id`,
    [IDS.stud1, IDS.course1, IDS.prof1],
  );
  const g2 = await db.query(
    `INSERT INTO grades (student_id, course_id, professor_id, value)
     VALUES ($1, $2, $3, 7.00) RETURNING id`,
    [IDS.stud2, IDS.course1, IDS.prof1],
  );
  const g3 = await db.query(
    `INSERT INTO grades (student_id, course_id, professor_id, value)
     VALUES ($1, $2, $3, 9.00) RETURNING id`,
    [IDS.stud1, IDS.course2, IDS.prof2],
  );
  IDS.grade1 = g1.rows[0].id;
  IDS.grade2 = g2.rows[0].id;
  IDS.grade3 = g3.rows[0].id;

  // Expune ID-urile global pentru toate testele
  global.__TEST_IDS__ = IDS;

  return IDS;
}

async function clearTestData() {
  await db.query('DELETE FROM audit_logs');

  // Sterge DOAR datele create de utilizatorii de test (@test.ro)
  await db.query(`
    DELETE FROM grades WHERE professor_id IN (
      SELECT id FROM users WHERE email LIKE '%@test.ro'
    )
  `);
  await db.query(`
    DELETE FROM students WHERE user_id IN (
      SELECT id FROM users WHERE email LIKE '%@test.ro'
    )
  `);
  await db.query(`
    DELETE FROM courses WHERE professor_id IN (
      SELECT id FROM users WHERE email LIKE '%@test.ro'
    )
  `);
  await db.query("DELETE FROM users WHERE email LIKE '%@test.ro'");
}

module.exports = { seedTestData, clearTestData };
