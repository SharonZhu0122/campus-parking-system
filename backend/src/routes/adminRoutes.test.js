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

const createdViolationIds = [];
const createdEventIds = [];
const ownerPlate = `OW${Date.now().toString(36).toUpperCase().slice(-4)}`;

afterAll(async () => {
  await Violation.destroy({ where: { id: [testViolationId, ...createdViolationIds] } });
  await ParkingEvent.destroy({ where: { plateNumber: 'TST999' } });
  await ParkingEvent.destroy({ where: { id: createdEventIds } });
  await User.destroy({ where: { username: ['rbac_normal_user', 'rbac_admin_user', 'rbac_owner'] } });
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

describe('entering and editing violations by hand', () => {
  const auth = () => ({ Authorization: `Bearer ${adminToken}` });
  let gateId;
  let manualId;

  beforeAll(async () => {
    gateId = (await GateArea.findOne()).id;
    await User.create({
      username: 'rbac_owner',
      passwordHash: await bcrypt.hash('testpass123', 10),
      role: 'user',
      plateNumber: ownerPlate,
      contactEmail: 'owner@example.com',
      phoneNumber: '021 555 0100',
    });
  });

  test('only an admin can add or edit', async () => {
    const body = { plateNumber: 'ABC123', gateAreaId: gateId, violationType: 'reserved_violation' };
    const add = await request(app).post('/api/admin/violations').set('Authorization', `Bearer ${normalUserToken}`).send(body);
    expect(add.status).toBe(403);
    const edit = await request(app).patch(`/api/admin/violations/${testViolationId}`).set('Authorization', `Bearer ${normalUserToken}`).send({ note: 'x' });
    expect(edit.status).toBe(403);
  });

  test('rejects missing or invalid details', async () => {
    const post = (body) => request(app).post('/api/admin/violations').set(auth()).send(body);
    expect((await post({})).status).toBe(400);
    expect((await post({ plateNumber: '!!', gateAreaId: gateId, violationType: 'reserved_violation' })).status).toBe(400);
    expect((await post({ plateNumber: 'ABC123', gateAreaId: gateId, violationType: 'speeding' })).status).toBe(400);
    expect((await post({ plateNumber: 'ABC123', gateAreaId: 999999, violationType: 'reserved_violation' })).status).toBe(404);
    expect((await post({ plateNumber: 'ABC123', gateAreaId: gateId, violationType: 'reserved_violation', note: 'x'.repeat(501) })).status).toBe(400);
  });

  test('adds a violation that records who entered it', async () => {
    const res = await request(app)
      .post('/api/admin/violations')
      .set(auth())
      .send({ plateNumber: ` ${ownerPlate.toLowerCase().slice(0, 3)}-${ownerPlate.slice(3)} `, gateAreaId: gateId, violationType: 'unpaid_violation', note: ' Seen on patrol ' });
    expect(res.status).toBe(201);
    manualId = res.body.id;
    createdViolationIds.push(manualId);
    createdEventIds.push(res.body.ParkingEvent.id);
    expect(res.body.source).toBe('manual');
    expect(res.body.createdBy).toBe('rbac_admin_user');
    expect(res.body.note).toBe('Seen on patrol');
    expect(res.body.ParkingEvent.plateNumber).toBe(ownerPlate);
    expect(res.body.ParkingEvent.paymentStatus).toBe('unpaid');
    expect(res.body.resolved).toBe(false);
  });

  test('appears at the top of the list and in the counts', async () => {
    const list = await request(app).get('/api/admin/violations?limit=5').set(auth());
    expect(list.body.length).toBeLessThanOrEqual(5);
    expect(list.body[0].id).toBe(manualId);
    const summary = await request(app).get('/api/admin/violations/summary').set(auth());
    expect(summary.body.total).toBeGreaterThanOrEqual(1);
    expect(summary.body.unresolved).toBeLessThanOrEqual(summary.body.total);
  });

  test('an open violation can be corrected and the edit is recorded', async () => {
    const res = await request(app)
      .patch(`/api/admin/violations/${manualId}`)
      .set(auth())
      .send({ violationType: 'reserved_violation', note: 'Checked the permit list' });
    expect(res.status).toBe(200);
    expect(res.body.violationType).toBe('reserved_violation');
    expect(res.body.note).toBe('Checked the permit list');
    expect(res.body.editedBy).toBe('rbac_admin_user');
    expect(res.body.editedAt).not.toBeNull();
  });

  test('a misread plate can be fixed, and a note can be cleared', async () => {
    const res = await request(app).patch(`/api/admin/violations/${manualId}`).set(auth()).send({ plateNumber: 'zz 99', note: '' });
    expect(res.status).toBe(200);
    expect(res.body.ParkingEvent.plateNumber).toBe('ZZ99');
    expect(res.body.note).toBeNull();
    await request(app).patch(`/api/admin/violations/${manualId}`).set(auth()).send({ plateNumber: ownerPlate });
  });

  test('rejects an empty or invalid edit', async () => {
    expect((await request(app).patch(`/api/admin/violations/${manualId}`).set(auth()).send({})).status).toBe(400);
    expect((await request(app).patch(`/api/admin/violations/${manualId}`).set(auth()).send({ plateNumber: '!' })).status).toBe(400);
    expect((await request(app).patch(`/api/admin/violations/${manualId}`).set(auth()).send({ violationType: 'nope' })).status).toBe(400);
    expect((await request(app).patch('/api/admin/violations/999999').set(auth()).send({ note: 'x' })).status).toBe(404);
  });

  test('a manual violation is resolved and the owner is notified like any other', async () => {
    const res = await request(app).patch(`/api/admin/violations/${manualId}/resolve`).set(auth()).send({ resolutionType: 'ticket_issued' });
    expect(res.status).toBe(200);
    expect(res.body.notificationSent).toBe(true);
    expect(res.body.notifiedContact).toBe('owner@example.com');
  });

  test('a resolved violation cannot be edited', async () => {
    const res = await request(app).patch(`/api/admin/violations/${manualId}`).set(auth()).send({ note: 'too late' });
    expect(res.status).toBe(409);
  });
});
