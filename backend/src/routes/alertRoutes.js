const express = require('express');
const { getUpcomingAlerts } = require('../services/keyDates');

const router = express.Router();

// ?today=YYYY-MM-DD lets the page be demonstrated on a date near an event.
router.get('/', (req, res) => {
  const requested = req.query.today;
  const today = /^\d{4}-\d{2}-\d{2}$/.test(requested || '') ? requested : undefined;
  res.json({ alerts: getUpcomingAlerts(today) });
});

module.exports = router;
