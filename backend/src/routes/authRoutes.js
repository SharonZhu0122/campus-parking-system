const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { PLATE_PATTERN, EMAIL_PATTERN, PHONE_PATTERN, MIN_PASSWORD_LENGTH, normalisePlate } = require('../utils/validation');
const { createLimiter } = require('../utils/rateLimit');

const router = express.Router();

// Slows down anyone guessing passwords: 10 wrong tries every 15 minutes per address.
const loginLimiter = createLimiter(10, 15 * 60 * 1000);

router.post('/register', async (req, res) => {
  const { username, password, plateNumber, contactEmail, phoneNumber } = req.body;
  if (!username || !password || !plateNumber || !contactEmail || !phoneNumber) {
    return res.status(400).json({
      error: 'username, password, plateNumber, contactEmail and phoneNumber are required',
    });
  }

  if (String(password).length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `password must be at least ${MIN_PASSWORD_LENGTH} characters` });
  }
  const plate = normalisePlate(plateNumber);
  if (!PLATE_PATTERN.test(plate)) {
    return res.status(400).json({ error: 'plate number must be 2 to 6 letters or digits' });
  }
  if (!EMAIL_PATTERN.test(String(contactEmail).trim())) {
    return res.status(400).json({ error: 'please enter a valid email address' });
  }
  if (!PHONE_PATTERN.test(String(phoneNumber).trim())) {
    return res.status(400).json({ error: 'please enter a valid phone number' });
  }

  const existing = await User.findOne({ where: { username } });
  if (existing) {
    return res.status(409).json({ error: 'username already taken' });
  }

  const plateOwner = await User.findOne({ where: { plateNumber: plate } });
  if (plateOwner) {
    return res.status(409).json({ error: 'this plate number is already registered' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    username,
    passwordHash,
    role: 'user',
    plateNumber: plate,
    contactEmail: String(contactEmail).trim(),
    phoneNumber: String(phoneNumber).trim(),
  });

  res.status(201).json({ id: user.id, username: user.username, role: user.role });
});

router.post('/login', async (req, res) => {
  if (loginLimiter.blocked(req.ip)) {
    return res.status(429).json({ error: 'too many login attempts, please try again later' });
  }
  const { username, password } = req.body;
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'username and password are required' });
  }
  const user = await User.findOne({ where: { username } });
  const passwordMatches = user && (await bcrypt.compare(password, user.passwordHash));
  if (!passwordMatches) {
    loginLimiter.record(req.ip);
    return res.status(401).json({ error: 'invalid username or password' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  res.json({ token, role: user.role });
});

module.exports = router;
module.exports.loginLimiter = loginLimiter;
