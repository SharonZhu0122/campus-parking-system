const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User, PasswordReset } = require('../models');
const { sendMail } = require('../services/mailer');
const { createLimiter } = require('../utils/rateLimit');
const { EMAIL_PATTERN, MIN_PASSWORD_LENGTH } = require('../utils/validation');

const router = express.Router();

const TOKEN_LIFETIME_MS = 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const forgotLimiter = createLimiter(5, 15 * 60 * 1000);
const resetLimiter = createLimiter(10, 15 * 60 * 1000);

// The same answer whether or not the email is registered, so the form cannot
// be used to find out who has an account.
const SENT_MESSAGE = 'If an account uses that email, a reset link has been sent. It is valid for 1 hour.';

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function resetLink(token) {
  const base = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');
  return `${base}/?reset=${token}`;
}

router.post('/forgot-password', async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
  if (!EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ error: 'please enter a valid email address' });
  }
  if (!forgotLimiter.allow(req.ip)) {
    return res.status(429).json({ error: 'too many requests, please try again later' });
  }

  const users = await User.findAll({ where: { role: 'user', contactEmail: email } });
  for (const user of users) {
    const recent = await PasswordReset.findOne({
      where: { userId: user.id, createdAt: { [Op.gt]: new Date(Date.now() - RESEND_COOLDOWN_MS) } },
    });
    if (recent) continue;

    const token = crypto.randomBytes(32).toString('hex');
    await PasswordReset.create({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + TOKEN_LIFETIME_MS),
    });
    await sendMail({
      to: email,
      subject: 'Reset your Campus Parking password',
      text:
        `Hello ${user.username},\n\n` +
        `Someone asked to reset the password for your Campus Parking account. ` +
        `Open this link to choose a new password (valid for 1 hour):\n\n${resetLink(token)}\n\n` +
        `If you did not ask for this, you can ignore this email and your password will stay the same.`,
    });
  }

  res.json({ message: SENT_MESSAGE });
});

router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (typeof token !== 'string' || !token || typeof newPassword !== 'string' || !newPassword) {
    return res.status(400).json({ error: 'token and newPassword are required' });
  }
  if (!resetLimiter.allow(req.ip)) {
    return res.status(429).json({ error: 'too many attempts, please try again later' });
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `new password must be at least ${MIN_PASSWORD_LENGTH} characters` });
  }

  const record = await PasswordReset.findOne({
    where: { tokenHash: hashToken(token), usedAt: null, expiresAt: { [Op.gt]: new Date() } },
  });
  const user = record ? await User.findByPk(record.userId) : null;
  if (!record || !user) {
    return res.status(400).json({ error: 'this reset link is invalid or has expired' });
  }

  await user.update({ passwordHash: await bcrypt.hash(newPassword, 10) });
  await record.update({ usedAt: new Date() });
  // Any other link sent earlier stops working too.
  await PasswordReset.destroy({ where: { userId: user.id, usedAt: null } });

  res.json({ message: 'password updated' });
});

module.exports = router;
module.exports.limiters = { forgotLimiter, resetLimiter };
