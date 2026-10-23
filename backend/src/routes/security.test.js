const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = require('../app');
const { loginLimiter } = require('./authRoutes');
const { sequelize, User, GateArea, Inquiry } = require('../models');

const stamp = Date.now().toString(36).toUpperCase().slice(-4);
const PASSWORD = 'SecurePass123';
const names = { user: `secUser${stamp}`, admin: `secAdmin${stamp}`, escalate: `secEsc${stamp}` };
let userToken;
let adminToken;

async function login(username, password = PASSWORD) {
  return request(app).post('/api/login').send({ username, password });
}

beforeAll(async () => {
  loginLimiter.clear();
  await User.create({ username: names.admin, passwordHash: await bcrypt.hash(PASSWORD, 10), role: 'admin' });
  await request(app).post('/api/register').send({
    username: names.user,
    password: PASSWORD,
    plateNumber: `SU${stamp}`,
    contactEmail: 'sec@example.com',
    phoneNumber: '021 555 0111',
  });
  userToken = (await login(names.user)).body.token;
  adminToken = (await login(names.admin)).body.token;
});

beforeEach(() => loginLimiter.clear());

afterAll(async () => {
  await User.destroy({ where: { username: Object.values(names) } });
  await Inquiry.destroy({ where: { email: 'xss@example.com' } });
  await sequelize.close();
});

describe('injection attempts', () => {
  test('SQL in the login fields does not log anyone in', async () => {
    const res = await login("' OR '1'='1", "' OR '1'='1");
    expect(res.status).toBe(401);
    expect(res.body.token).toBeUndefined();
  });

  test('objects in place of strings are refused (no query operators)', async () => {
    const res = await request(app).post('/api/login').send({ username: { $ne: '' }, password: { $ne: '' } });
    expect(res.status).toBe(400);
  });

  test('SQL in the plate number is rejected by validation', async () => {
    const res = await request(app).post('/api/register').send({
      username: `secInj${stamp}`,
      password: PASSWORD,
      plateNumber: "AB1'; DROP TABLE Users;--",
      contactEmail: 'a@example.com',
      phoneNumber: '021 555 0112',
    });
    expect(res.status).toBe(400);
    expect(await User.count()).toBeGreaterThan(0);
  });

  test('SQL in a query string is rejected', async () => {
    const res = await request(app)
      .get("/api/admin/violations?status=open' OR '1'='1")
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
  });

  test('an id that is not a plain number is not found, not read as a number', async () => {
    const gate = await GateArea.findOne();
    for (const id of [`${gate.id}abc`, `${gate.id}%20OR%201=1`, '-1', '1e0']) {
      const res = await request(app).get(`/api/gates/${id}/occupancy`);
      expect(res.status).toBe(404);
    }
  });

  test('text with HTML is stored and returned as plain text', async () => {
    const text = '<script>alert(1)</script>';
    const res = await request(app).post('/api/inquiries').send({ question: text, email: 'xss@example.com' });
    expect(res.status).toBe(201);
    const list = await request(app).get('/api/admin/inquiries').set('Authorization', `Bearer ${adminToken}`);
    expect(list.headers['content-type']).toMatch(/application\/json/);
    expect(list.body.find((i) => i.email === 'xss@example.com').question).toBe(text);
  });
});

describe('tokens', () => {
  const adminUrl = '/api/admin/violations';

  test('no token, a broken token and a token signed with another secret are all refused', async () => {
    expect((await request(app).get(adminUrl)).status).toBe(401);
    expect((await request(app).get(adminUrl).set('Authorization', 'Bearer not-a-token')).status).toBe(401);
    const forged = jwt.sign({ id: 1, username: 'x', role: 'admin' }, 'some-other-secret');
    expect((await request(app).get(adminUrl).set('Authorization', `Bearer ${forged}`)).status).toBe(401);
  });

  test('a token whose payload was edited no longer verifies', async () => {
    const [header, , signature] = userToken.split('.');
    const payload = Buffer.from(JSON.stringify({ id: 1, username: names.user, role: 'admin' })).toString('base64url');
    const res = await request(app).get(adminUrl).set('Authorization', `Bearer ${header}.${payload}.${signature}`);
    expect(res.status).toBe(401);
  });

  test('a token with no signature (alg none) is refused', async () => {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ id: 1, username: 'x', role: 'admin' })).toString('base64url');
    const res = await request(app).get(adminUrl).set('Authorization', `Bearer ${header}.${payload}.`);
    expect(res.status).toBe(401);
  });

  test('an expired token is refused', async () => {
    const expired = jwt.sign({ id: 1, username: 'x', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: -10 });
    expect((await request(app).get(adminUrl).set('Authorization', `Bearer ${expired}`)).status).toBe(401);
  });
});

describe('privileges', () => {
  test('a normal user cannot use any admin action', async () => {
    const auth = { Authorization: `Bearer ${userToken}` };
    expect((await request(app).get('/api/admin/violations').set(auth)).status).toBe(403);
    expect((await request(app).get('/api/admin/inquiries').set(auth)).status).toBe(403);
    expect((await request(app).post('/api/admin/violations').set(auth).send({})).status).toBe(403);
    expect((await request(app).post('/api/admin/violations/sample').set(auth)).status).toBe(403);
    expect((await request(app).patch('/api/admin/violations/1').set(auth).send({ note: 'x' })).status).toBe(403);
  });

  test('asking for the admin role while registering is ignored', async () => {
    const res = await request(app).post('/api/register').send({
      username: names.escalate,
      password: PASSWORD,
      plateNumber: `SE${stamp}`,
      contactEmail: 'esc@example.com',
      phoneNumber: '021 555 0113',
      role: 'admin',
    });
    expect(res.status).toBe(201);
    expect(res.body.role).toBe('user');
    const token = (await login(names.escalate)).body.token;
    expect((await request(app).get('/api/admin/violations').set('Authorization', `Bearer ${token}`)).status).toBe(403);
  });

  test('extra fields in a profile update cannot change the role or the password hash', async () => {
    const res = await request(app)
      .patch('/api/me/profile')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ contactEmail: 'still@example.com', role: 'admin', passwordHash: 'x', id: 1 });
    expect(res.status).toBe(200);
    const user = await User.findOne({ where: { username: names.user } });
    expect(user.role).toBe('user');
    expect(user.passwordHash.startsWith('$2')).toBe(true);
    expect(await bcrypt.compare(PASSWORD, user.passwordHash)).toBe(true);
  });
});

describe('what the API reveals', () => {
  test('passwords are stored hashed and never sent back', async () => {
    const user = await User.findOne({ where: { username: names.user } });
    expect(user.passwordHash).not.toContain(PASSWORD);
    expect(user.passwordHash.startsWith('$2')).toBe(true);

    const responses = [
      await login(names.user),
      await request(app).get('/api/me/profile').set('Authorization', `Bearer ${userToken}`),
      await request(app).get('/api/me/vehicle').set('Authorization', `Bearer ${userToken}`),
    ];
    for (const res of responses) {
      expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|\$2[aby]\$/);
    }
  });

  test('a wrong username and a wrong password get the same answer', async () => {
    const wrongUser = await login(`nobody_${stamp}`, 'whatever123');
    const wrongPassword = await login(names.user, 'whatever123');
    expect(wrongUser.status).toBe(401);
    expect(wrongPassword.status).toBe(401);
    expect(wrongUser.body).toEqual(wrongPassword.body);
  });

  test('responses carry no X-Powered-By and ask browsers not to guess types', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
});

describe('guessing passwords', () => {
  test('ten wrong tries lock the address out, even for the right password', async () => {
    for (let i = 0; i < 10; i++) {
      expect((await login(names.user, `wrong-${i}-password`)).status).toBe(401);
    }
    expect((await login(names.user)).status).toBe(429);
  });

  test('successful logins are not counted against the limit', async () => {
    for (let i = 0; i < 15; i++) {
      expect((await login(names.user)).status).toBe(200);
    }
  });

  test('a password shorter than six characters cannot be registered', async () => {
    const res = await request(app).post('/api/register').send({
      username: `secShort${stamp}`,
      password: '12345',
      plateNumber: `SS${stamp}`,
      contactEmail: 'short@example.com',
      phoneNumber: '021 555 0114',
    });
    expect(res.status).toBe(400);
  });
});

describe('which websites may call the API', () => {
  test('a listed website gets the CORS header, another one does not', async () => {
    const allowed = await request(app).get('/api/health').set('Origin', 'https://campus-parking-waikato.vercel.app');
    expect(allowed.headers['access-control-allow-origin']).toBe('https://campus-parking-waikato.vercel.app');
    const other = await request(app).get('/api/health').set('Origin', 'https://evil.example');
    expect(other.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('errors at the edges', () => {
  test('an unknown address gets a JSON 404', async () => {
    const res = await request(app).get('/api/nothing-here');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  test('a broken JSON body gets a 400', async () => {
    const res = await request(app).post('/api/login').set('Content-Type', 'application/json').send('{"username": ');
    expect(res.status).toBe(400);
  });

  test('a very large body gets a 413', async () => {
    const res = await request(app).post('/api/inquiries').send({ question: 'x'.repeat(200000), email: 'big@example.com' });
    expect(res.status).toBe(413);
  });

  test('an unexpected failure is a 500 that does not reveal the cause', async () => {
    const spy = jest.spyOn(GateArea, 'findAll').mockRejectedValue(new Error('secret database details'));
    const logged = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = await request(app).get('/api/gates');
    spy.mockRestore();
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain('secret');
    expect(logged).toHaveBeenCalled();
    logged.mockRestore();
  });
});
