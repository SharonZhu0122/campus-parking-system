const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../app');
const { sequelize, User, GateArea, ParkingEvent, Violation } = require('../models');

let normalUserToken;
let adminToken;
let testViolationId;

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

  const gate = await GateArea.findOne();
  const event = await ParkingEvent.create({
    plateNumber: 'TST999',
    gateAreaId: gate.id,
    parkType: 'reserved',
    paymentStatus: 'not_required',
    eventTime: new Date(),
    durationMinutes: 60,
  });
  const violation = await Violation.create({
    violationType: 'reserved_violation',
    parkingEventId: event.id,
  });
  testViolationId = violation.id;
});

afterAll(async () => {
  await Violation.destroy({ where: { id: testViolationId } });
  await ParkingEvent.destroy({ where: { plateNumber: 'TST999' } });
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

test('rejects resolving without a valid resolutionType', async () => {
  const res = await request(app)
    .patch(`/api/admin/violations/${testViolationId}/resolve`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({});
  expect(res.status).toBe(400);
});

test('resolves a violation and records who and when', async () => {
  const res = await request(app)
    .patch(`/api/admin/violations/${testViolationId}/resolve`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ resolutionType: 'ticket_issued' });

  expect(res.status).toBe(200);
  expect(res.body.resolved).toBe(true);
  expect(res.body.resolutionType).toBe('ticket_issued');
  expect(res.body.resolvedBy).toBe('rbac_admin_user');
  expect(res.body.resolvedAt).not.toBeNull();
});
