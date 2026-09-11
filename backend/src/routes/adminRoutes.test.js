const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../app');
const { sequelize, User } = require('../models');

let normalUserToken;
let adminToken;

beforeAll(async () => {
  const passwordHash = await bcrypt.hash('testpass123', 10);
  await User.create({ username: 'rbac_normal_user', passwordHash, role: 'user' });
  await User.create({ username: 'rbac_admin_user', passwordHash, role: 'admin' });

  const normalLogin = await request(app)
    .post('/api/login')
    .send({ username: 'rbac_normal_user', password: 'testpass123' });
  normalUserToken = normalLogin.body.token;

  const adminLogin = await request(app)
    .post('/api/login')
    .send({ username: 'rbac_admin_user', password: 'testpass123' });
  adminToken = adminLogin.body.token;
});

afterAll(async () => {
  await User.destroy({ where: { username: ['rbac_normal_user', 'rbac_admin_user'] } });
  await sequelize.close();
});

test('rejects a request with no login token', async () => {
  const res = await request(app).get('/api/admin/violations');
  expect(res.status).toBe(401);
});

test('rejects a normal user token on an admin-only endpoint', async () => {
  const res = await request(app)
    .get('/api/admin/violations')
    .set('Authorization', `Bearer ${normalUserToken}`);
  expect(res.status).toBe(403);
});

test('accepts an admin token on an admin-only endpoint', async () => {
  const res = await request(app)
    .get('/api/admin/violations')
    .set('Authorization', `Bearer ${adminToken}`);
  expect(res.status).toBe(200);
});
