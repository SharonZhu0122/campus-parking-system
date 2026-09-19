const express = require('express');
const { Violation, ParkingEvent, GateArea } = require('../models');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { getOccupancySeries } = require('../services/occupancy');
const {
  movingAverage,
  linearRegressionPredictNext,
  backtestAccuracy,
} = require('../services/predictions');

const router = express.Router();

const PREDICTION_WINDOW = 3;

router.get('/predictions/:gateId', requireAuth, requireAdmin, async (req, res) => {
  const { gateName, series } = await getOccupancySeries(req.params.gateId, 1, 24);
  const values = series.map((point) => point.occupancyPercent);

  const movingAveragePrediction = movingAverage(values, PREDICTION_WINDOW);
  const linearRegressionPrediction = linearRegressionPredictNext(values.slice(-PREDICTION_WINDOW));
  const accuracy = backtestAccuracy(values, PREDICTION_WINDOW);

  let moreAccurateMethod = null;
  if (accuracy.testedPoints > 0) {
    moreAccurateMethod =
      accuracy.movingAverageError <= accuracy.linearRegressionError
        ? 'moving_average'
        : 'linear_regression';
  }

  res.json({
    gateId: Number(req.params.gateId),
    gateName,
    series,
    movingAveragePrediction,
    linearRegressionPrediction,
    accuracy,
    moreAccurateMethod,
  });
});

router.get('/violations', requireAuth, requireAdmin, async (req, res) => {
  const violations = await Violation.findAll({
    include: [{ model: ParkingEvent, include: [GateArea] }],
    order: [['createdAt', 'DESC']],
  });
  res.json(violations);
});

const VALID_RESOLUTION_TYPES = ['ticket_issued', 'false_positive', 'other'];

router.patch('/violations/:id/resolve', requireAuth, requireAdmin, async (req, res) => {
  const { resolutionType } = req.body;
  if (!VALID_RESOLUTION_TYPES.includes(resolutionType)) {
    return res.status(400).json({ error: 'resolutionType must be one of ' + VALID_RESOLUTION_TYPES.join(', ') });
  }

  const violation = await Violation.findByPk(req.params.id);
  if (!violation) {
    return res.status(404).json({ error: 'violation not found' });
  }

  violation.resolved = true;
  violation.resolvedAt = new Date();
  violation.resolvedBy = req.user.username;
  violation.resolutionType = resolutionType;
  await violation.save();
  res.json(violation);
});

module.exports = router;
