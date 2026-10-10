const express = require('express');
const { User, Violation, ParkingEvent, GateArea } = require('../models');
const { requireAuth } = require('../middleware/auth');

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

module.exports = router;
