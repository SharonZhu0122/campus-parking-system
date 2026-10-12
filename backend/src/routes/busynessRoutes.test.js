const request = require('supertest');
const app = require('../app');
const { sequelize, GateArea } = require('../models');

afterAll(async () => {
  await sequelize.close();
});

test('is public and describes now plus a typical week', async () => {
  const gate = await GateArea.findOne();
  const res = await request(app).get(`/api/gates/${gate.id}/busyness`);
  expect(res.status).toBe(200);
  expect(res.body.gateName).toBe(gate.name);
  expect(['plenty', 'getting_busy', 'almost_full']).toContain(res.body.now.status);
  expect(['busier', 'usual', 'quieter']).toContain(res.body.now.comparison);
  expect(['busier', 'steady', 'quieter']).toContain(res.body.now.nextHour);
  expect(res.body.now.available).toBe(res.body.totalParks - res.body.now.occupied);
  expect(res.body.typicalWeek).toHaveLength(7);
  expect(res.body.typicalWeek[1].hours).toHaveLength(24);
  expect(res.body.basedOn).toBe('simulated data');
});

test('returns 404 for a gate that does not exist', async () => {
  const res = await request(app).get('/api/gates/999999/busyness');
  expect(res.status).toBe(404);
});
