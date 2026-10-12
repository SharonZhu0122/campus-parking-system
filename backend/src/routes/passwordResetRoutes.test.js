jest.mock('../services/mailer', () => ({ sendMail: jest.fn().mockResolvedValue(true) }));

const request = require('supertest');
const app = require('../app');
const { sendMail } = require('../services/mailer');
const { limiters } = require('./passwordResetRoutes');
const { sequelize, User, PasswordReset } = require('../models');

const stamp = Date.now().toString(36).toUpperCase().slice(-4);
const username = `pw_${stamp}`;
const email = `pw_${stamp}@example.com`;
let userId;

function lastToken() {
  const text = sendMail.mock.calls[sendMail.mock.calls.length - 1][0].text;
  return text.match(/reset=([a-f0-9]+)/)[1];
}

beforeAll(async () => {
  const res = await request(app).post('/api/register').send({
    username,
    password: 'OldPass123',
    plateNumber: `PW${stamp}`,
    contactEmail: email,
    phoneNumber: '021 555 0188',
  });
  userId = res.body.id;
});

beforeEach(() => {
  limiters.forgotLimiter.clear();
  limiters.resetLimiter.clear();
  sendMail.mockClear();
});

afterAll(async () => {
  await PasswordReset.destroy({ where: { userId } });
  await User.destroy({ where: { username } });
  await sequelize.close();
});

test('rejects an invalid email', async () => {
  const res = await request(app).post('/api/forgot-password').send({ email: 'nope' });
  expect(res.status).toBe(400);
});

test('gives the same answer for an unknown email and sends nothing', async () => {
  const known = await request(app).post('/api/forgot-password').send({ email });
  sendMail.mockClear();
  const unknown = await request(app).post('/api/forgot-password').send({ email: `nobody_${stamp}@example.com` });
  expect(unknown.status).toBe(200);
  expect(unknown.body).toEqual(known.body);
  expect(sendMail).not.toHaveBeenCalled();
});

test('emails a reset link and stores only a hash of the token', async () => {
  await PasswordReset.destroy({ where: { userId } });
  const res = await request(app).post('/api/forgot-password').send({ email });
  expect(res.status).toBe(200);
  expect(sendMail).toHaveBeenCalledTimes(1);
  expect(sendMail.mock.calls[0][0].to).toBe(email);

  const token = lastToken();
  const stored = await PasswordReset.findOne({ where: { userId } });
  expect(stored.tokenHash).not.toBe(token);
  expect(stored.tokenHash).toHaveLength(64);
});

test('does not send a second email within the cooldown', async () => {
  await request(app).post('/api/forgot-password').send({ email });
  expect(sendMail).not.toHaveBeenCalled();
});

test('limits repeated requests from one address', async () => {
  let last;
  for (let i = 0; i < 6; i++) {
    last = await request(app).post('/api/forgot-password').send({ email: `nobody_${stamp}@example.com` });
  }
  expect(last.status).toBe(429);
});

test('a valid link sets a new password and works only once', async () => {
  await PasswordReset.destroy({ where: { userId } });
  await request(app).post('/api/forgot-password').send({ email });
  const token = lastToken();

  const short = await request(app).post('/api/reset-password').send({ token, newPassword: '123' });
  expect(short.status).toBe(400);

  const ok = await request(app).post('/api/reset-password').send({ token, newPassword: 'NewPass456' });
  expect(ok.status).toBe(200);

  const oldLogin = await request(app).post('/api/login').send({ username, password: 'OldPass123' });
  expect(oldLogin.status).toBe(401);
  const newLogin = await request(app).post('/api/login').send({ username, password: 'NewPass456' });
  expect(newLogin.status).toBe(200);

  const again = await request(app).post('/api/reset-password').send({ token, newPassword: 'Another789' });
  expect(again.status).toBe(400);
});

test('rejects an unknown or expired token', async () => {
  const unknown = await request(app).post('/api/reset-password').send({ token: 'a'.repeat(64), newPassword: 'NewPass456' });
  expect(unknown.status).toBe(400);

  await PasswordReset.destroy({ where: { userId } });
  await request(app).post('/api/forgot-password').send({ email });
  const token = lastToken();
  await PasswordReset.update({ expiresAt: new Date(Date.now() - 1000) }, { where: { userId } });
  const expired = await request(app).post('/api/reset-password').send({ token, newPassword: 'NewPass456' });
  expect(expired.status).toBe(400);
});
