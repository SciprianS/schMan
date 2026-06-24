const request = require('supertest');
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

describe('GET /api/students', () => {
  test('Adminul vede toti elevii', async () => {
    const res = await request(app)
      .get('/api/students')
      .set('Authorization', `Bearer ${tokens.admin}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  test('Profesorul vede toti elevii', async () => {
    const res = await request(app)
      .get('/api/students')
      .set('Authorization', `Bearer ${tokens.prof1}`);
    expect(res.statusCode).toBe(200);
  });

  test('[ESCALADARE VERTICALA] Studentul NU poate lista toti elevii', async () => {
    const res = await request(app)
      .get('/api/students')
      .set('Authorization', `Bearer ${tokens.stud1}`);
    expect(res.statusCode).toBe(403);
  });
});

describe('GET /api/students/:id', () => {
  test('Studentul poate citi propriul profil', async () => {
    const IDS = global.__TEST_IDS__;
    const res = await request(app)
      .get(`/api/students/${IDS.stud1}`)
      .set('Authorization', `Bearer ${tokens.stud1}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.user_id).toBe(IDS.stud1);
  });

  test('[IDOR] Studentul NU poate citi profilul altui elev', async () => {
    const IDS = global.__TEST_IDS__;
    const res = await request(app)
      .get(`/api/students/${IDS.stud2}`)
      .set('Authorization', `Bearer ${tokens.stud1}`);
    expect(res.statusCode).toBe(403);
  });

  test('Adminul poate citi orice profil', async () => {
    const IDS = global.__TEST_IDS__;
    const res = await request(app)
      .get(`/api/students/${IDS.stud2}`)
      .set('Authorization', `Bearer ${tokens.admin}`);
    expect(res.statusCode).toBe(200);
  });

  test('Profesorul poate citi orice profil de elev', async () => {
    const IDS = global.__TEST_IDS__;
    const res = await request(app)
      .get(`/api/students/${IDS.stud1}`)
      .set('Authorization', `Bearer ${tokens.prof1}`);
    expect(res.statusCode).toBe(200);
  });
});
