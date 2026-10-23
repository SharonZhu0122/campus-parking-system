jest.mock('../models', () => ({ User: { findOne: jest.fn(), create: jest.fn() } }));

const express = require('express');
const request = require('supertest');
const { User } = require('../models');
const authRoutes = require('./authRoutes');

const app = express();
app.use(express.json());
app.use('/api', authRoutes);

function details(username) {
  return { username, password: 'TestPass123', plateNumber: 'ABC123', contactEmail: 'owner@example.com', phoneNumber: '021 555 0199' };
}

beforeEach(() => {
  jest.clearAllMocks();
  User.findOne.mockResolvedValue(null);
  User.create.mockImplementation(async (values) => ({ id: 1, ...values }));
});

test.each(['Sharon123', 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', '0123456789', 'a'])(
  'allows the alphanumeric username %s', async (username) => {
    const res = await request(app).post('/api/register').send(details(username));
    expect(res.status).toBe(201);
    expect(res.body.username).toBe(username);
    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ username }));
  }
);

test.each(['sharon_zhu', 'sharon-zhu', 'sharon.zhu', 'sharon@123', 'sharon zhu', ' Sharon', 'Sharon ', '中文', 'José', 'ＡＢＣ１２３', 'Sharon😀', 'abc\n', 'abc\t', 123, ['Sharon'], { name: 'Sharon' }, '', null])(
  'rejects the invalid username %j before querying the database', async (username) => {
    const res = await request(app).post('/api/register').send(details(username));
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/username/);
    expect(User.findOne).not.toHaveBeenCalled();
    expect(User.create).not.toHaveBeenCalled();
  }
);

test('still rejects an existing valid username', async () => {
  User.findOne.mockResolvedValueOnce({ id: 2, username: 'Sharon123' });
  const res = await request(app).post('/api/register').send(details('Sharon123'));
  expect(res.status).toBe(409);
  expect(User.create).not.toHaveBeenCalled();
});
