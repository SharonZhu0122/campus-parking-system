const request = require('supertest');
const app = require('../app');
const { sequelize, User } = require('../models');

const stamp = Date.now().toString(36);
const createdUsernames = [];

function newUser(overrides = {}) {
  const username = `t_${stamp}_${createdUsernames.length}`;
  createdUsernames.push(username);
  return {
    username,
    password: 'TestPass123',
    plateNumber: 'ZZ' + Math.floor(1000 + Math.random() * 8999),
    contactEmail: 'owner@example.com',
    phoneNumber: '021 555 0199',
    ...overrides,
  };
}

afterAll(async () => {
  await User.destroy({ where: { username: createdUsernames } });
  await sequelize.close();
});

test('registers a user with valid details and stores the plate in upper case', async () => {
  const body = newUser({ plateNumber: 'abc12' });
  const res = await request(app).post('/api/register').send(body);
  expect(res.status).toBe(201);
  const saved = await User.findOne({ where: { username: body.username } });
  expect(saved.plateNumber).toBe('ABC12');
});

test('rejects an invalid email', async () => {
  const res = await request(app).post('/api/register').send(newUser({ contactEmail: 'asdf' }));
  expect(res.status).toBe(400);
  expect(res.body.error).toMatch(/email/);
});

test('rejects an invalid phone number', async () => {
  const res = await request(app).post('/api/register').send(newUser({ phoneNumber: 'abc' }));
  expect(res.status).toBe(400);
  expect(res.body.error).toMatch(/phone/);
});

test('rejects an invalid plate number', async () => {
  const res = await request(app).post('/api/register').send(newUser({ plateNumber: '!!' }));
  expect(res.status).toBe(400);
  expect(res.body.error).toMatch(/plate/);
});

test('rejects a second account using the same plate, even if typed differently', async () => {
  const first = newUser({ plateNumber: 'DUP999' });
  expect((await request(app).post('/api/register').send(first)).status).toBe(201);
  const second = newUser({ plateNumber: 'dup 999' });
  const res = await request(app).post('/api/register').send(second);
  expect(res.status).toBe(409);
  expect(res.body.error).toMatch(/already registered/);
});
