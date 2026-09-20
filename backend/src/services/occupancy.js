const { GateArea, ParkingEvent } = require('../models');

function isCurrentlyParked(event, now) {
  const start = new Date(event.eventTime);
  const end = new Date(start.getTime() + event.durationMinutes * 60000);
  return now >= start && now <= end;
}

async function getGateOccupancy(gateAreaId) {
  const gate = await GateArea.findByPk(gateAreaId);
  const events = await ParkingEvent.findAll({ where: { gateAreaId } });

  const now = new Date();
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
  const events = await ParkingEvent.findAll({ where: { gateAreaId } });

  const now = new Date();
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
