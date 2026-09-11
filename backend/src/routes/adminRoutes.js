const express = require('express');
const { Violation, ParkingEvent, GateArea } = require('../models');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/violations', requireAuth, requireAdmin, async (req, res) => {
  const violations = await Violation.findAll({
    include: [{ model: ParkingEvent, include: [GateArea] }],
    order: [['createdAt', 'DESC']],
  });
  res.json(violations);
});

router.patch('/violations/:id/resolve', requireAuth, requireAdmin, async (req, res) => {
  const violation = await Violation.findByPk(req.params.id);
  if (!violation) {
    return res.status(404).json({ error: 'violation not found' });
  }
  violation.resolved = true;
  await violation.save();
  res.json(violation);
});

module.exports = router;
