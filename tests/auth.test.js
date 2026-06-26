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

describe('POST /api/auth/register', () => {

  test('Creeaza cont nou cu date valide', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'nou@test.ro', password: 'Parola123!',
        firstName: 'Utilizator', lastName: 'Nou', role: 'student'
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user).not.toHaveProperty('password_hash');
  });

  test('Respinge email duplicat', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'admin@test.ro', password: 'Test1234!',
        firstName: 'Alt', lastName: 'Admin', role: 'admin'
      });
    expect(res.statusCode).toBe(409);
  });

  test('Respinge campuri lipsa', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'incomplet@test.ro' });
    expect(res.statusCode).toBe(400);
  });

  test('Respinge rol invalid', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'rol@test.ro', password: 'Test1234!',
        firstName: 'Test', lastName: 'Test', role: 'superadmin'
      });
    expect(res.statusCode).toBe(400);
  });
});

describe('POST /api/auth/login', () => {

  test('Login reusit cu credentiale corecte', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.ro', password: 'Test1234!' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.role).toBe('admin');
  });

  test('Respinge parola incorecta', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.ro', password: 'ParodaGresita!' });
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Credentiale invalide.');
  });

  test('Respinge email inexistent cu acelasi mesaj', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'inexistent@test.ro', password: 'Test1234!' });
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Credentiale invalide.');
  });
});

describe('GET /api/auth/me', () => {

  test('Returneaza profilul utilizatorului autentificat', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.ro', password: 'Test1234!' });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe('admin@test.ro');
    expect(res.body).not.toHaveProperty('password_hash');
  });

  test('Respinge cerere fara token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });

  test('Respinge token falsificat', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer token.falsificat.total');
    expect(res.statusCode).toBe(403);
  });
});
