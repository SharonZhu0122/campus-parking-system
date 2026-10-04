const express = require('express');
const { GateArea } = require('../models');
const { getGateOccupancy, getOccupancySeries } = require('../services/occupancy');
const {
  movingAverage,
  linearRegressionPredictNext,
  backtestAccuracy,
} = require('../services/predictions');

const router = express.Router();

router.get('/', async (req, res) => {
  const gates = await GateArea.findAll();
  res.json(gates);
});

router.get('/:id/occupancy', async (req, res) => {
  const occupancy = await getGateOccupancy(req.params.id);
  res.json(occupancy);
});

const PREDICTION_WINDOW = 3;

router.get('/:id/predictions', async (req, res) => {
  const gate = await GateArea.findByPk(req.params.id);
  if (!gate) {
    return res.status(404).json({ error: 'gate not found' });
  }

  const { gateName, totalParks, series } = await getOccupancySeries(gate.id, 1, 24);
  const availableValues = series.map((point) => point.available);

  const movingAveragePrediction = movingAverage(availableValues, PREDICTION_WINDOW);
  const linearRegressionPrediction = linearRegressionPredictNext(
    availableValues.slice(-PREDICTION_WINDOW)
  );
  const accuracy = backtestAccuracy(availableValues, PREDICTION_WINDOW);

  let moreAccurateMethod = null;
  if (accuracy.testedPoints > 0) {
    moreAccurateMethod =
      accuracy.movingAverageError <= accuracy.linearRegressionError
        ? 'moving_average'
        : 'linear_regression';
  }

  res.json({
    gateId: gate.id,
    gateName,
    totalParks,
    series,
    movingAveragePrediction,
    linearRegressionPrediction,
    accuracy,
    moreAccurateMethod,
  });
});

module.exports = router;
