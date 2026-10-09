const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const router = express.Router();

// NZ plates are up to 6 letters/digits, including personalised ones.
const PLATE_PATTERN = /^[A-Z0-9]{2,6}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9][0-9\s-]{6,18}$/;

function normalisePlate(plate) {
  return String(plate).toUpperCase().replace(/[\s-]/g, '');
}

router.post('/register', async (req, res) => {
  const { username, password, plateNumber, contactEmail, phoneNumber } = req.body;
  if (!username || !password || !plateNumber || !contactEmail || !phoneNumber) {
    return res.status(400).json({
      error: 'username, password, plateNumber, contactEmail and phoneNumber are required',
    });
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
  const { username, password } = req.body;
  const user = await User.findOne({ where: { username } });
  if (!user) {
    return res.status(401).json({ error: 'invalid username or password' });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
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
