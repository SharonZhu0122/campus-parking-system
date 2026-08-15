const express = require('express');
const { GateArea } = require('../models');
const { getGateOccupancy } = require('../services/occupancy');

const router = express.Router();

router.get('/', async (req, res) => {
  const gates = await GateArea.findAll();
  res.json(gates);
});

router.get('/:id/occupancy', async (req, res) => {
  const occupancy = await getGateOccupancy(req.params.id);
  res.json(occupancy);
});

module.exports = router;
