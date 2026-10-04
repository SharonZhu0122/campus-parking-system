const express = require('express');
const { askAssistant, MAX_QUESTION_LENGTH } = require('../services/assistant');

const router = express.Router();

// Free-tier quotas are shared by every visitor, so cap both each visitor and
// the whole site. In-memory is enough for a single backend instance.
const PER_VISITOR_LIMIT = 8;
const PER_VISITOR_WINDOW_MS = 10 * 60 * 1000;
const DAILY_LIMIT = 300;

const visitorHits = new Map();
let dailyCount = 0;
let dailyResetAt = Date.now() + 24 * 60 * 60 * 1000;

function allowRequest(visitorId, now = Date.now()) {
  if (now > dailyResetAt) {
    dailyCount = 0;
    dailyResetAt = now + 24 * 60 * 60 * 1000;
  }
  if (dailyCount >= DAILY_LIMIT) return false;

  const recent = (visitorHits.get(visitorId) || []).filter((t) => now - t < PER_VISITOR_WINDOW_MS);
  if (recent.length >= PER_VISITOR_LIMIT) {
    visitorHits.set(visitorId, recent);
    return false;
  }
  recent.push(now);
  visitorHits.set(visitorId, recent);
  dailyCount += 1;
  return true;
}

function resetLimits() {
  visitorHits.clear();
  dailyCount = 0;
  dailyResetAt = Date.now() + 24 * 60 * 60 * 1000;
}

router.post('/', async (req, res) => {
  const question = typeof req.body.question === 'string' ? req.body.question.trim() : '';
  if (!question) {
    return res.status(400).json({ error: 'question is required' });
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return res.status(400).json({ error: `question must be ${MAX_QUESTION_LENGTH} characters or fewer` });
  }

  if (!allowRequest(req.ip)) {
    return res.status(429).json({ error: 'too many questions, please try again later', fallback: true });
  }

  try {
    const answer = await askAssistant(question);
    res.json({ answer });
  } catch {
    res.status(503).json({ error: 'the assistant is unavailable right now', fallback: true });
  }
});

module.exports = router;
module.exports.resetLimits = resetLimits;
