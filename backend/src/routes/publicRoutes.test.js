const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../models');

afterAll(() => sequelize.close());

test('predictions are public: no login needed', async () => {
  const gates = await request(app).get('/api/gates');
  const res = await request(app).get(`/api/gates/${gates.body[0].id}/predictions`);
  expect(res.status).toBe(200);
  expect(res.body.series).toHaveLength(24);
  expect(res.body).toHaveProperty('movingAveragePrediction');
});

test('predictions for a gate that does not exist return 404', async () => {
  const res = await request(app).get('/api/gates/999999/predictions');
  expect(res.status).toBe(404);
});

test('the old admin-only predictions path is gone', async () => {
  const res = await request(app).get('/api/admin/predictions/1');
  expect(res.status).toBe(404);
});

test('alerts endpoint warns 3 days before graduation', async () => {
  const res = await request(app).get('/api/alerts?today=2026-10-16');
  expect(res.status).toBe(200);
  expect(res.body.alerts[0].name).toBe('Graduation ceremonies (Hamilton)');
  expect(res.body.alerts[0].daysUntil).toBe(3);
});

test('alerts endpoint is empty on a quiet day', async () => {
  const res = await request(app).get('/api/alerts?today=2026-10-05');
  expect(res.body.alerts).toEqual([]);
});
