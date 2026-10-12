const express = require('express');
const { Violation, ParkingEvent, GateArea, User, Inquiry } = require('../models');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { PLATE_PATTERN, normalisePlate } = require('../utils/validation');
const { VIOLATION_TYPES, EVENT_FOR_TYPE } = require('../services/violationTypes');
const { replaceOpenViolations } = require('../services/violationSampler');

const router = express.Router();

const DEFAULT_LIST_LIMIT = 100;
const MAX_LIST_LIMIT = 500;
const MAX_NOTE_LENGTH = 500;
const WITH_EVENT = [{ model: ParkingEvent, include: [GateArea] }];

const LIST_STATUSES = ['open', 'resolved', 'all'];

// Open violations by default: the ones staff still have to deal with.
router.get('/violations', requireAuth, requireAdmin, async (req, res) => {
  const status = req.query.status || 'open';
  if (!LIST_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'status must be one of ' + LIST_STATUSES.join(', ') });
  }
  const requested = Number.parseInt(req.query.limit, 10);
  const limit = Number.isInteger(requested) && requested > 0 ? Math.min(requested, MAX_LIST_LIMIT) : DEFAULT_LIST_LIMIT;

  const where = status === 'all' ? {} : { resolved: status === 'resolved' };
  const order = status === 'resolved' ? [['resolvedAt', 'DESC']] : [['createdAt', 'DESC']];
  const violations = await Violation.findAll({ where, include: WITH_EVENT, order, limit });
  res.json(violations);
});

router.get('/violations/summary', requireAuth, requireAdmin, async (req, res) => {
  const total = await Violation.count();
  const unresolved = await Violation.count({ where: { resolved: false } });
  res.json({ total, unresolved, resolved: total - unresolved });
});

// Demo helper: swap the open detections for a fresh batch of random ones.
router.post('/violations/sample', requireAuth, requireAdmin, async (req, res) => {
  const created = await replaceOpenViolations();
  res.json({ created });
});

// Staff record what they find on patrol. It becomes an ordinary violation that
// can be resolved, and the owner is notified in the same way.
router.post('/violations', requireAuth, requireAdmin, async (req, res) => {
  const { plateNumber, gateAreaId, violationType } = req.body;
  const note = typeof req.body.note === 'string' ? req.body.note.trim() : '';

  if (!plateNumber || !gateAreaId || !violationType) {
    return res.status(400).json({ error: 'plateNumber, gateAreaId and violationType are required' });
  }
  const plate = normalisePlate(plateNumber);
  if (!PLATE_PATTERN.test(plate)) {
    return res.status(400).json({ error: 'plate number must be 2 to 6 letters or digits' });
  }
  if (!VIOLATION_TYPES.includes(violationType)) {
    return res.status(400).json({ error: 'violationType must be one of ' + VIOLATION_TYPES.join(', ') });
  }
  if (note.length > MAX_NOTE_LENGTH) {
    return res.status(400).json({ error: `note must be ${MAX_NOTE_LENGTH} characters or fewer` });
  }
  const gate = await GateArea.findByPk(gateAreaId);
  if (!gate) {
    return res.status(404).json({ error: 'gate not found' });
  }

  const event = await ParkingEvent.create({
    plateNumber: plate,
    gateAreaId: gate.id,
    ...EVENT_FOR_TYPE[violationType],
    eventTime: new Date(),
    durationMinutes: 30,
  });
  const violation = await Violation.create({
    violationType,
    parkingEventId: event.id,
    source: 'manual',
    createdBy: req.user.username,
    note: note || null,
  });

  res.status(201).json(await Violation.findByPk(violation.id, { include: WITH_EVENT }));
});

// Fix a mistake in a violation that is still open, such as a misread plate.
// Resolved violations are a record of what was done, so they stay as they are.
router.patch('/violations/:id', requireAuth, requireAdmin, async (req, res) => {
  const violation = await Violation.findByPk(req.params.id, { include: WITH_EVENT });
  if (!violation) {
    return res.status(404).json({ error: 'violation not found' });
  }
  if (violation.resolved) {
    return res.status(409).json({ error: 'a resolved violation cannot be edited' });
  }

  const { plateNumber, violationType, note } = req.body;
  if (plateNumber === undefined && violationType === undefined && note === undefined) {
    return res.status(400).json({ error: 'nothing to update' });
  }

  if (violationType !== undefined) {
    if (!VIOLATION_TYPES.includes(violationType)) {
      return res.status(400).json({ error: 'violationType must be one of ' + VIOLATION_TYPES.join(', ') });
    }
    violation.violationType = violationType;
  }
  if (note !== undefined) {
    const text = typeof note === 'string' ? note.trim() : '';
    if (text.length > MAX_NOTE_LENGTH) {
      return res.status(400).json({ error: `note must be ${MAX_NOTE_LENGTH} characters or fewer` });
    }
    violation.note = text || null;
  }
  if (plateNumber !== undefined) {
    const plate = normalisePlate(plateNumber);
    if (!PLATE_PATTERN.test(plate)) {
      return res.status(400).json({ error: 'plate number must be 2 to 6 letters or digits' });
    }
    await violation.ParkingEvent.update({ plateNumber: plate });
  }

  violation.editedBy = req.user.username;
  violation.editedAt = new Date();
  await violation.save();

  res.json(await Violation.findByPk(violation.id, { include: WITH_EVENT }));
});

const VALID_RESOLUTION_TYPES = ['ticket_issued', 'false_positive', 'other'];

router.patch('/violations/:id/resolve', requireAuth, requireAdmin, async (req, res) => {
  const { resolutionType } = req.body;
  if (!VALID_RESOLUTION_TYPES.includes(resolutionType)) {
    return res.status(400).json({ error: 'resolutionType must be one of ' + VALID_RESOLUTION_TYPES.join(', ') });
  }

  const violation = await Violation.findByPk(req.params.id, {
    include: [{ model: ParkingEvent, include: [GateArea] }],
  });
  if (!violation) {
    return res.status(404).json({ error: 'violation not found' });
  }

  violation.resolved = true;
  violation.resolvedAt = new Date();
  violation.resolvedBy = req.user.username;
  violation.resolutionType = resolutionType;

  if (resolutionType === 'ticket_issued') {
    const owner = await User.findOne({
      where: { plateNumber: violation.ParkingEvent.plateNumber },
    });
    if (owner && owner.contactEmail) {
      violation.notificationSent = true;
      violation.notifiedContact = owner.contactEmail;
    } else {
      violation.notificationSent = false;
      violation.notifiedContact = null;
    }
  } else {
    violation.notificationSent = false;
    violation.notifiedContact = null;
  }

  await violation.save();
  res.json(violation);
});

router.get('/inquiries', requireAuth, requireAdmin, async (req, res) => {
  const inquiries = await Inquiry.findAll({ order: [['createdAt', 'DESC']] });
  res.json(inquiries);
});

module.exports = router;
