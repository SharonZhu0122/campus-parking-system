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

module.exports = { isCurrentlyParked, getGateOccupancy };
