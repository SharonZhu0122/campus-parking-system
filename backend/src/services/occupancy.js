const { Op } = require('sequelize');
const { GateArea, ParkingEvent } = require('../models');
const { MAX_STAY_MINUTES } = require('./simulationConfig');

// A car that arrived more than this long before `since` has already left.
function eventsSince(gateAreaId, since) {
  const earliest = new Date(since.getTime() - (MAX_STAY_MINUTES + 5) * 60000);
  return ParkingEvent.findAll({ where: { gateAreaId, eventTime: { [Op.gte]: earliest } } });
}

function isCurrentlyParked(event, now) {
  const start = new Date(event.eventTime);
  const end = new Date(start.getTime() + event.durationMinutes * 60000);
  return now >= start && now <= end;
}

async function getGateOccupancy(gateAreaId) {
  const gate = await GateArea.findByPk(gateAreaId);
  const now = new Date();
  const events = await eventsSince(gateAreaId, now);
  const occupiedCount = events.filter((event) => isCurrentlyParked(event, now)).length;
  const occupancyPercent = Math.round((occupiedCount / gate.totalParks) * 100);

  return {
    gateId: gate.id,
    gateName: gate.name,
    occupied: occupiedCount,
    totalParks: gate.totalParks,
    occupancyPercent,
  };
}

async function getOccupancySeries(gateAreaId, bucketHours = 1, numBuckets = 24) {
  const gate = await GateArea.findByPk(gateAreaId);
  const now = new Date();
  const events = await eventsSince(gateAreaId, new Date(now.getTime() - numBuckets * bucketHours * 60 * 60000));
  const series = [];
  for (let i = numBuckets - 1; i >= 0; i--) {
    const bucketTime = new Date(now.getTime() - i * bucketHours * 60 * 60000);
    const occupiedCount = events.filter((event) => isCurrentlyParked(event, bucketTime)).length;
    const occupancyPercent = Math.round((occupiedCount / gate.totalParks) * 100);
    const available = gate.totalParks - occupiedCount;
    series.push({ time: bucketTime, occupied: occupiedCount, available, occupancyPercent });
  }

  return { gateId: gate.id, gateName: gate.name, totalParks: gate.totalParks, series };
}

module.exports = { isCurrentlyParked, getGateOccupancy, getOccupancySeries };
