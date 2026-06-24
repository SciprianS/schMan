const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { getTokens } = require('./helpers/auth');
const { seedTestData, clearTestData } = require('./helpers/db');

let tokens;

beforeAll(async () => {
  await seedTestData();
  tokens = getTokens();
});
afterAll(async () => {
  await clearTestData();
});

describe('VA1 — IDOR (Insecure Direct Object Reference)', () => {
  test('Student NU poate accesa nota altui student prin ID', async () => {
    const IDS = global.__TEST_IDS__;
    const res = await request(app)
      .get(`/api/grades/${IDS.grade2}`)
      .set('Authorization', `Bearer ${tokens.stud1}`);
    expect(res.statusCode).toBe(403);
  });

  test('Tentativa IDOR este inregistrata in audit cu status FORBIDDEN', async () => {
    const IDS = global.__TEST_IDS__;
    await request(app)
      .get(`/api/grades/${IDS.grade2}`)
      .set('Authorization', `Bearer ${tokens.stud1}`);
    const audit = await request(app)
      .get('/api/audit?status=FORBIDDEN')
      .set('Authorization', `Bearer ${tokens.admin}`);
    const idor = audit.body.find(
      (l) => l.resource_type === 'Grade' && l.user_id === IDS.stud1,
    );
    expect(idor).toBeDefined();
    expect(idor.status).toBe('FORBIDDEN');
  });

  test('Student NU poate accesa profilul altui elev prin ID', async () => {
    const IDS = global.__TEST_IDS__;
    const res = await request(app)
      .get(`/api/students/${IDS.stud2}`)
      .set('Authorization', `Bearer ${tokens.stud1}`);
    expect(res.statusCode).toBe(403);
  });
});

describe('VA2 — Escaladare verticala de privilegii', () => {
  test('Student NU poate crea note (actiune de profesor)', async () => {
    const IDS = global.__TEST_IDS__;
    const res = await request(app)
      .post('/api/grades')
      .set('Authorization', `Bearer ${tokens.stud1}`)
      .send({ studentId: IDS.stud1, courseId: IDS.course1, value: 10 });
    expect(res.statusCode).toBe(403);
  });

  test('Student NU poate sterge note (actiune de admin)', async () => {
    const IDS = global.__TEST_IDS__;
    const res = await request(app)
      .delete(`/api/grades/${IDS.grade1}`)
      .set('Authorization', `Bearer ${tokens.stud1}`);
    expect(res.statusCode).toBe(403);
  });

  test('Student NU poate lista utilizatori (actiune de admin)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${tokens.stud1}`);
    expect(res.statusCode).toBe(403);
  });

  test('Profesor NU poate accesa loguri de audit (actiune de admin)', async () => {
    const res = await request(app)
      .get('/api/audit')
      .set('Authorization', `Bearer ${tokens.prof1}`);
    expect(res.statusCode).toBe(403);
  });

  test('Profesor NU poate sterge note (interzis explicit in CASL)', async () => {
    const IDS = global.__TEST_IDS__;
    const res = await request(app)
      .delete(`/api/grades/${IDS.grade1}`)
      .set('Authorization', `Bearer ${tokens.prof1}`);
    expect(res.statusCode).toBe(403);
  });

  test('Profesor NU poate modifica nota altui profesor (escaladare orizontala)', async () => {
    const IDS = global.__TEST_IDS__;
    // Nota 3 e acordata de prof2, prof1 incearca sa o modifice
    const res = await request(app)
      .put(`/api/grades/${IDS.grade3}`)
      .set('Authorization', `Bearer ${tokens.prof1}`)
      .send({ value: 5.0 });
    expect(res.statusCode).toBe(403);
  });
});

describe('VA3 — Manipulare token JWT', () => {
  test('Token cu semnatura invalida este respins', async () => {
    const header = Buffer.from('{"alg":"HS256","typ":"JWT"}').toString(
      'base64url',
    );
    const payload = Buffer.from('{"id":3,"role":"admin"}').toString(
      'base64url',
    );
    const tokenFalsificat = `${header}.${payload}.semnaturaFalsaComplet`;

    const res = await request(app)
      .get('/api/audit')
      .set('Authorization', `Bearer ${tokenFalsificat}`);
    expect(res.statusCode).toBe(403);
  });

  test('Token expirat este respins', async () => {
    const expirat = jwt.sign(
      { id: 3, role: 'student' },
      process.env.JWT_SECRET,
      { expiresIn: '0s' },
    );
    await new Promise((r) => setTimeout(r, 100));
    const res = await request(app)
      .get('/api/grades')
      .set('Authorization', `Bearer ${expirat}`);
    expect(res.statusCode).toBe(403);
  });

  test('Token fara prefix Bearer este respins', async () => {
    const res = await request(app)
      .get('/api/grades')
      .set('Authorization', tokens.admin); // lipseste "Bearer "
    expect(res.statusCode).toBe(403);
  });
});

describe('VA4 — Acces fara autentificare', () => {
  const IDS = global.__TEST_IDS__;

  const endpoints = [
    { method: 'get', path: '/api/grades' },
    { method: 'get', path: `/api/grades/${IDS.grade1}` },
    { method: 'post', path: '/api/grades' },
    { method: 'get', path: '/api/students' },
    { method: 'get', path: '/api/users' },
    { method: 'get', path: '/api/audit' },
  ];

  endpoints.forEach(({ method, path }) => {
    test(`${method.toUpperCase()} ${path} respinge cerere fara token`, async () => {
      const res = await request(app)[method](path);
      expect(res.statusCode).toBe(401);
    });
  });
});

describe('VA5 — SQL Injection', () => {
  test('SQL Injection in body este blocat de interogari parametrizate', async () => {
    const IDS = global.__TEST_IDS__;
    const res = await request(app)
      .post('/api/grades')
      .set('Authorization', `Bearer ${tokens.prof1}`)
      .send({
        studentId: '3; DROP TABLE grades; --',
        courseId: IDS.course1,
        value: 9,
      });
    expect(res.statusCode).not.toBe(201);

    // Verificam ca tabelul grades inca exista
    const check = await request(app)
      .get('/api/grades')
      .set('Authorization', `Bearer ${tokens.admin}`);
    expect(check.statusCode).toBe(200);
  });
});

describe('VA6 — Acces neautorizat la loguri de audit', () => {
  test('Profesorul NU poate vizualiza logurile de audit', async () => {
    const res = await request(app)
      .get('/api/audit')
      .set('Authorization', `Bearer ${tokens.prof1}`);
    expect(res.statusCode).toBe(403);
  });

  test('Studentul NU poate vizualiza logurile de audit', async () => {
    const res = await request(app)
      .get('/api/audit')
      .set('Authorization', `Bearer ${tokens.stud1}`);
    expect(res.statusCode).toBe(403);
  });
});
