const request = require('supertest');
const app = require('../app');
const { sequelize, User, ParkingEvent, Violation } = require('../models');

const stamp = Date.now().toString(36).toUpperCase().slice(-4);
const plateA = `MA${stamp}`;
const plateB = `MB${stamp}`;
const usernames = [`meA${stamp}`, `meB${stamp}`, `meC${stamp}`, `meD${stamp}`, `meE${stamp}`];
const events = [];

async function register(username, plateNumber) {
  await request(app).post('/api/register').send({
    username,
    password: 'TestPass123',
    plateNumber,
    contactEmail: 'owner@example.com',
    phoneNumber: '021 555 0199',
  });
  const login = await request(app).post('/api/login').send({ username, password: 'TestPass123' });
  return login.body.token;
}

async function addViolation(plateNumber) {
  const event = await ParkingEvent.create({
    plateNumber,
    gateAreaId: 1,
    parkType: 'reserved',
    paymentStatus: 'unpaid',
    mobilityCardValid: false,
    eventTime: new Date(),
    durationMinutes: 30,
  });
  events.push(event.id);
  return Violation.create({ violationType: 'reserved_violation', parkingEventId: event.id });
}

afterAll(async () => {
  await Violation.destroy({ where: { parkingEventId: events } });
  await ParkingEvent.destroy({ where: { id: events } });
  await User.destroy({ where: { username: usernames } });
  await sequelize.close();
});

test('needs a login', async () => {
  const res = await request(app).get('/api/me/vehicle');
  expect(res.status).toBe(401);
});

test("a user sees only their own plate's violations", async () => {
  await addViolation(plateA);
  await addViolation(plateA);
  await addViolation(plateB);

  const tokenA = await register(usernames[0], plateA);
  const tokenB = await register(usernames[1], plateB);

  const a = await request(app).get('/api/me/vehicle').set('Authorization', `Bearer ${tokenA}`);
  expect(a.status).toBe(200);
  expect(a.body.plateNumber).toBe(plateA);
  expect(a.body.violations).toHaveLength(2);

  const b = await request(app).get('/api/me/vehicle').set('Authorization', `Bearer ${tokenB}`);
  expect(b.body.plateNumber).toBe(plateB);
  expect(b.body.violations).toHaveLength(1);
});

test('a plate with no violations returns an empty list', async () => {
  const token = await register(usernames[2], `MC${stamp}`);
  const res = await request(app).get('/api/me/vehicle').set('Authorization', `Bearer ${token}`);
  expect(res.status).toBe(200);
  expect(res.body.violations).toEqual([]);
});

test('the plate cannot be chosen through the request', async () => {
  const tokenB = await register(usernames[1], plateB);
  const res = await request(app)
    .get(`/api/me/vehicle?plateNumber=${plateA}`)
    .set('Authorization', `Bearer ${tokenB}`);
  expect(res.body.plateNumber).toBe(plateB);
  expect(res.body.violations).toHaveLength(1);
});

describe('account settings', () => {
  const plateD = `MD${stamp}`;
  const plateE = `ME${stamp}`;
  let tokenD;

  beforeAll(async () => {
    tokenD = await register(usernames[3], plateD);
    await register(usernames[4], plateE);
  });

  test('needs a login', async () => {
    const res = await request(app).get('/api/me/profile');
    expect(res.status).toBe(401);
  });

  test('returns the profile without the password', async () => {
    const res = await request(app).get('/api/me/profile').set('Authorization', `Bearer ${tokenD}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      username: usernames[3],
      plateNumber: plateD,
      contactEmail: 'owner@example.com',
      phoneNumber: '021 555 0199',
    });
  });

  test('changes email and phone, and the plate is normalised', async () => {
    const newPlate = `MN${stamp}`;
    const res = await request(app)
      .patch('/api/me/profile')
      .set('Authorization', `Bearer ${tokenD}`)
      .send({ plateNumber: ` ${newPlate.toLowerCase().slice(0, 2)}-${newPlate.slice(2)} `, contactEmail: 'new@example.com', phoneNumber: '+64 21 555 0100' });
    expect(res.status).toBe(200);
    expect(res.body.plateNumber).toBe(newPlate);
    expect(res.body.contactEmail).toBe('new@example.com');
    expect(res.body.phoneNumber).toBe('+64 21 555 0100');
  });

  test('violations follow the new plate', async () => {
    const newPlate = `MN${stamp}`;
    await addViolation(newPlate);
    const res = await request(app).get('/api/me/vehicle').set('Authorization', `Bearer ${tokenD}`);
    expect(res.body.plateNumber).toBe(newPlate);
    expect(res.body.violations).toHaveLength(1);
  });

  test('rejects a plate that belongs to another account', async () => {
    const res = await request(app).patch('/api/me/profile').set('Authorization', `Bearer ${tokenD}`).send({ plateNumber: plateE });
    expect(res.status).toBe(409);
  });

  test('keeping your own plate is allowed', async () => {
    const res = await request(app).patch('/api/me/profile').set('Authorization', `Bearer ${tokenD}`).send({ plateNumber: `MN${stamp}` });
    expect(res.status).toBe(200);
  });

  test('rejects bad formats and empty updates', async () => {
    const auth = { Authorization: `Bearer ${tokenD}` };
    expect((await request(app).patch('/api/me/profile').set(auth).send({ plateNumber: '!!' })).status).toBe(400);
    expect((await request(app).patch('/api/me/profile').set(auth).send({ contactEmail: 'nope' })).status).toBe(400);
    expect((await request(app).patch('/api/me/profile').set(auth).send({ phoneNumber: 'abc' })).status).toBe(400);
    expect((await request(app).patch('/api/me/profile').set(auth).send({})).status).toBe(400);
  });

  test('changes the password only with the correct current password', async () => {
    const auth = { Authorization: `Bearer ${tokenD}` };
    const wrong = await request(app).put('/api/me/password').set(auth).send({ currentPassword: 'WrongPass1', newPassword: 'BrandNew456' });
    expect(wrong.status).toBe(401);

    const short = await request(app).put('/api/me/password').set(auth).send({ currentPassword: 'TestPass123', newPassword: '123' });
    expect(short.status).toBe(400);

    const ok = await request(app).put('/api/me/password').set(auth).send({ currentPassword: 'TestPass123', newPassword: 'BrandNew456' });
    expect(ok.status).toBe(200);

    const oldLogin = await request(app).post('/api/login').send({ username: usernames[3], password: 'TestPass123' });
    expect(oldLogin.status).toBe(401);
    const newLogin = await request(app).post('/api/login').send({ username: usernames[3], password: 'BrandNew456' });
    expect(newLogin.status).toBe(200);
  });
});
