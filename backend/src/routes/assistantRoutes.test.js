const request = require('supertest');
const app = require('../app');
const { resetLimits } = require('./assistantRoutes');

function mockGemini(text) {
  return jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }),
  });
}

beforeEach(() => {
  process.env.GEMINI_API_KEY = 'test-key';
  resetLimits();
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('rejects an empty question', async () => {
  const res = await request(app).post('/api/assistant').send({ question: '   ' });
  expect(res.status).toBe(400);
});

test('rejects a question longer than 300 characters', async () => {
  const res = await request(app).post('/api/assistant').send({ question: 'a'.repeat(301) });
  expect(res.status).toBe(400);
});

test('returns the model answer and sends only the question plus the fact sheet', async () => {
  const spy = mockGemini('Paid hours are 8:30am to 4:30pm, Monday to Friday.');
  const res = await request(app).post('/api/assistant').send({ question: 'When is parking free?' });

  expect(res.status).toBe(200);
  expect(res.body.answer).toContain('8:30am');

  const [, options] = spy.mock.calls[0];
  const sent = JSON.parse(options.body);
  expect(sent.contents[0].parts[0].text).toBe('When is parking free?');
  expect(sent.systemInstruction.parts[0].text).toContain('Answer ONLY using the facts');
  expect(options.headers['x-goog-api-key']).toBe('test-key');
});

test('falls back cleanly when the model call fails', async () => {
  jest.spyOn(global, 'fetch').mockResolvedValue({ ok: false, status: 429 });
  const res = await request(app).post('/api/assistant').send({ question: 'Where is Gate 10?' });
  expect(res.status).toBe(503);
  expect(res.body.fallback).toBe(true);
});

test('falls back cleanly when no API key is configured', async () => {
  delete process.env.GEMINI_API_KEY;
  const spy = jest.spyOn(global, 'fetch');
  const res = await request(app).post('/api/assistant').send({ question: 'Where is Gate 10?' });
  expect(res.status).toBe(503);
  expect(spy).not.toHaveBeenCalled();
});

test('limits how many questions one visitor can ask', async () => {
  mockGemini('ok');
  for (let i = 0; i < 8; i += 1) {
    const ok = await request(app).post('/api/assistant').send({ question: 'hi' });
    expect(ok.status).toBe(200);
  }
  const blocked = await request(app).post('/api/assistant').send({ question: 'hi' });
  expect(blocked.status).toBe(429);
});
