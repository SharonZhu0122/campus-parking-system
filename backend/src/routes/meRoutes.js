const express = require('express');
const bcrypt = require('bcryptjs');
const { User, Violation, ParkingEvent, GateArea } = require('../models');
const { requireAuth } = require('../middleware/auth');
const {
  PLATE_PATTERN,
  EMAIL_PATTERN,
  PHONE_PATTERN,
  MIN_PASSWORD_LENGTH,
  normalisePlate,
} = require('../utils/validation');

const router = express.Router();

// A logged-in user can only ever see violations for their own registered
// plate: the plate comes from their account, never from the request.
router.get('/vehicle', requireAuth, async (req, res) => {
  const user = await User.findByPk(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'account not found' });
  }
  if (!user.plateNumber) {
    return res.json({ plateNumber: null, violations: [] });
  }

  const violations = await Violation.findAll({
    include: [{ model: ParkingEvent, where: { plateNumber: user.plateNumber }, include: [GateArea] }],
    order: [['createdAt', 'DESC']],
  });

  res.json({
    plateNumber: user.plateNumber,
    violations: violations.map((v) => ({
      id: v.id,
      violationType: v.violationType,
      gate: v.ParkingEvent.GateArea.name,
      time: v.ParkingEvent.eventTime,
      resolved: v.resolved,
      resolutionType: v.resolutionType,
      resolvedAt: v.resolvedAt,
      notificationSent: v.notificationSent,
      notifiedContact: v.notifiedContact,
    })),
  });
});

function profileOf(user) {
  return {
    username: user.username,
    plateNumber: user.plateNumber,
    contactEmail: user.contactEmail,
    phoneNumber: user.phoneNumber,
  };
}

// Account settings are only for registered drivers, not admin accounts.
async function loadDriver(req, res) {
  const user = await User.findByPk(req.user.id);
  if (!user) {
    res.status(404).json({ error: 'account not found' });
    return null;
  }
  if (user.role !== 'user') {
    res.status(403).json({ error: 'account settings are only for registered drivers' });
    return null;
  }
  return user;
}

router.get('/profile', requireAuth, async (req, res) => {
  const user = await loadDriver(req, res);
  if (!user) return;
  res.json(profileOf(user));
});

// Change the plate, email and/or phone. Every field that is sent must be valid,
// and a plate that belongs to another account is rejected.
router.patch('/profile', requireAuth, async (req, res) => {
  const user = await loadDriver(req, res);
  if (!user) return;

  const { plateNumber, contactEmail, phoneNumber } = req.body;
  const updates = {};

  if (plateNumber !== undefined) {
    const plate = normalisePlate(plateNumber);
    if (!PLATE_PATTERN.test(plate)) {
      return res.status(400).json({ error: 'plate number must be 2 to 6 letters or digits' });
    }
    const plateOwner = await User.findOne({ where: { plateNumber: plate } });
    if (plateOwner && plateOwner.id !== user.id) {
      return res.status(409).json({ error: 'this plate number is already registered' });
    }
    updates.plateNumber = plate;
  }
  if (contactEmail !== undefined) {
    if (!EMAIL_PATTERN.test(String(contactEmail).trim())) {
      return res.status(400).json({ error: 'please enter a valid email address' });
    }
    updates.contactEmail = String(contactEmail).trim();
  }
  if (phoneNumber !== undefined) {
    if (!PHONE_PATTERN.test(String(phoneNumber).trim())) {
      return res.status(400).json({ error: 'please enter a valid phone number' });
    }
    updates.phoneNumber = String(phoneNumber).trim();
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'nothing to update' });
  }

  await user.update(updates);
  res.json(profileOf(user));
});

router.put('/password', requireAuth, async (req, res) => {
  const user = await loadDriver(req, res);
  if (!user) return;

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'currentPassword and newPassword are required' });
  }
  if (String(newPassword).length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `new password must be at least ${MIN_PASSWORD_LENGTH} characters` });
  }
  const matches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) {
    return res.status(401).json({ error: 'current password is incorrect' });
  }

  await user.update({ passwordHash: await bcrypt.hash(newPassword, 10) });
  res.json({ message: 'password updated' });
});

module.exports = router;
