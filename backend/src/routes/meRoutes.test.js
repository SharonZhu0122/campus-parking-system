const request = require('supertest');
const app = require('../app');
const { sequelize, User, ParkingEvent, Violation } = require('../models');

const stamp = Date.now().toString(36).toUpperCase().slice(-4);
const plateA = `MA${stamp}`;
const plateB = `MB${stamp}`;
const usernames = [`me_a_${stamp}`, `me_b_${stamp}`, `me_c_${stamp}`];
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
