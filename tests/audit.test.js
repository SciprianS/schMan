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

describe('GET /api/audit', () => {

  test('Adminul poate accesa logurile de audit', async () => {
    const res = await request(app).get('/api/audit')
      .set('Authorization', `Bearer ${tokens.admin}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('[ESCALADARE VERTICALA] Profesorul NU poate accesa logurile', async () => {
    const res = await request(app).get('/api/audit')
      .set('Authorization', `Bearer ${tokens.prof1}`);
    expect(res.statusCode).toBe(403);
  });

  test('[ESCALADARE VERTICALA] Studentul NU poate accesa logurile', async () => {
    const res = await request(app).get('/api/audit')
      .set('Authorization', `Bearer ${tokens.stud1}`);
    expect(res.statusCode).toBe(403);
  });

  test('Logurile contin inregistrari dupa actiunile precedente', async () => {
    // Generam o actiune
    const IDS = global.__TEST_IDS__;
    await request(app).get(`/api/grades/${IDS.grade1}`)
      .set('Authorization', `Bearer ${tokens.admin}`);

    const res = await request(app).get('/api/audit')
      .set('Authorization', `Bearer ${tokens.admin}`);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('action');
    expect(res.body[0]).toHaveProperty('resource_type');
    expect(res.body[0]).toHaveProperty('status');
  });

  test('Filtrul dupa status FORBIDDEN functioneaza', async () => {
    const IDS = global.__TEST_IDS__;
    // Generam un FORBIDDEN
    await request(app).get(`/api/grades/${IDS.grade2}`)
      .set('Authorization', `Bearer ${tokens.stud1}`);

    const res = await request(app).get('/api/audit?status=FORBIDDEN')
      .set('Authorization', `Bearer ${tokens.admin}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.every(l => l.status === 'FORBIDDEN')).toBe(true);
  });

  test('Filtrul dupa userId functioneaza', async () => {
    const IDS = global.__TEST_IDS__;
    const res = await request(app).get(`/api/audit?userId=${IDS.admin}`)
      .set('Authorization', `Bearer ${tokens.admin}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.every(l => l.user_id === IDS.admin)).toBe(true);
  });
});
