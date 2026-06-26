const request = require('supertest');
const app     = require('../src/app');
const { seedTestData, clearTestData } = require('./helpers/db');
const { getTokens } = require('./helpers/auth');

let tokens;

beforeAll(async () => {
  await seedTestData();
  tokens = getTokens();
});
afterAll(async () => { await clearTestData(); });

describe('GET /api/grades', () => {

  test('Admin vede toate notele', async () => {
    const res = await request(app).get('/api/grades')
      .set('Authorization', `Bearer ${tokens.admin}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(3);
  });

  test('Profesorul vede doar notele proprii', async () => {
    const IDS = global.__TEST_IDS__;
    const res = await request(app).get('/api/grades')
      .set('Authorization', `Bearer ${tokens.prof1}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.every(g => g.professor_id === IDS.prof1)).toBe(true);
  });

  test('Studentul vede doar propriile note', async () => {
    const IDS = global.__TEST_IDS__;
    const res = await request(app).get('/api/grades')
      .set('Authorization', `Bearer ${tokens.stud1}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.every(g => g.student_id === IDS.stud1)).toBe(true);
  });

  test('Respinge cerere fara autentificare', async () => {
    const res = await request(app).get('/api/grades');
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/grades/:id', () => {

  test('Admin poate citi orice nota', async () => {
    const IDS = global.__TEST_IDS__;
    const res = await request(app).get(`/api/grades/${IDS.grade1}`)
      .set('Authorization', `Bearer ${tokens.admin}`);
    expect(res.statusCode).toBe(200);
  });

  test('Studentul proprietar poate citi propria nota', async () => {
    const IDS = global.__TEST_IDS__;
    const res = await request(app).get(`/api/grades/${IDS.grade1}`)
      .set('Authorization', `Bearer ${tokens.stud1}`);
    expect(res.statusCode).toBe(200);
  });

  test('[IDOR] Studentul NU poate citi nota altui student', async () => {
    const IDS = global.__TEST_IDS__;
    // grade2 apartine stud2
    const res = await request(app).get(`/api/grades/${IDS.grade2}`)
      .set('Authorization', `Bearer ${tokens.stud1}`);
    expect(res.statusCode).toBe(403);
  });

  test('[IDOR] Profesorul NU poate citi nota altui profesor', async () => {
    const IDS = global.__TEST_IDS__;
    // grade3 e acordata de prof2
    const res = await request(app).get(`/api/grades/${IDS.grade3}`)
      .set('Authorization', `Bearer ${tokens.prof1}`);
    expect(res.statusCode).toBe(403);
  });

  test('Returneaza 404 pentru nota inexistenta', async () => {
    const res = await request(app).get('/api/grades/999999')
      .set('Authorization', `Bearer ${tokens.admin}`);
    expect(res.statusCode).toBe(404);
  });
});

describe('POST /api/grades', () => {

  test('Profesorul poate crea o nota', async () => {
    const IDS = global.__TEST_IDS__;
    const res = await request(app).post('/api/grades')
      .set('Authorization', `Bearer ${tokens.prof1}`)
      .send({ studentId: IDS.stud1, courseId: IDS.course1, value: 9.50 });
    expect(res.statusCode).toBe(201);
    expect(res.body.professor_id).toBe(IDS.prof1);
  });

  test('[ESCALADARE VERTICALA] Studentul NU poate crea o nota', async () => {
    const IDS = global.__TEST_IDS__;
    const res = await request(app).post('/api/grades')
      .set('Authorization', `Bearer ${tokens.stud1}`)
      .send({ studentId: IDS.stud1, courseId: IDS.course1, value: 10 });
    expect(res.statusCode).toBe(403);
  });

  test('Respinge nota cu campuri lipsa', async () => {
    const res = await request(app).post('/api/grades')
      .set('Authorization', `Bearer ${tokens.prof1}`)
      .send({ studentId: 3 });
    expect(res.statusCode).toBe(400);
  });
});

describe('PUT /api/grades/:id', () => {

  test('Profesorul poate modifica nota proprie', async () => {
    const IDS = global.__TEST_IDS__;
    const res = await request(app).put(`/api/grades/${IDS.grade1}`)
      .set('Authorization', `Bearer ${tokens.prof1}`)
      .send({ value: 7.00 });
    expect(res.statusCode).toBe(200);
    expect(parseFloat(res.body.value)).toBe(7.00);
  });

  test('[IDOR] Profesorul NU poate modifica nota altui profesor', async () => {
    const IDS = global.__TEST_IDS__;
    // grade3 e acordata de prof2
    const res = await request(app).put(`/api/grades/${IDS.grade3}`)
      .set('Authorization', `Bearer ${tokens.prof1}`)
      .send({ value: 5.00 });
    expect(res.statusCode).toBe(403);
  });

  test('[ESCALADARE VERTICALA] Studentul NU poate modifica nicio nota', async () => {
    const IDS = global.__TEST_IDS__;
    const res = await request(app).put(`/api/grades/${IDS.grade1}`)
      .set('Authorization', `Bearer ${tokens.stud1}`)
      .send({ value: 10 });
    expect(res.statusCode).toBe(403);
  });

  test('Adminul poate modifica orice nota', async () => {
    const IDS = global.__TEST_IDS__;
    const res = await request(app).put(`/api/grades/${IDS.grade2}`)
      .set('Authorization', `Bearer ${tokens.admin}`)
      .send({ value: 6.00 });
    expect(res.statusCode).toBe(200);
  });
});

describe('DELETE /api/grades/:id', () => {

  test('[ESCALADARE VERTICALA] Profesorul NU poate sterge note', async () => {
    const IDS = global.__TEST_IDS__;
    const res = await request(app).delete(`/api/grades/${IDS.grade1}`)
      .set('Authorization', `Bearer ${tokens.prof1}`);
    expect(res.statusCode).toBe(403);
  });

  test('[ESCALADARE VERTICALA] Studentul NU poate sterge note', async () => {
    const IDS = global.__TEST_IDS__;
    const res = await request(app).delete(`/api/grades/${IDS.grade1}`)
      .set('Authorization', `Bearer ${tokens.stud1}`);
    expect(res.statusCode).toBe(403);
  });

  test('Adminul poate sterge orice nota', async () => {
    const IDS = global.__TEST_IDS__;
    const res = await request(app).delete(`/api/grades/${IDS.grade2}`)
      .set('Authorization', `Bearer ${tokens.admin}`);
    expect(res.statusCode).toBe(200);
  });
});
