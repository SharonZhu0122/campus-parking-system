const { Op } = require('sequelize');
const { GateArea, ParkingEvent } = require('../models');
const { MAX_STAY_MINUTES } = require('./simulationConfig');

// A car that arrived more than this long before `since` has already left.
function eventsSince(gateAreaId, since) {
  const earliest = new Date(since.getTime() - (MAX_STAY_MINUTES + 5) * 60000);
  return ParkingEvent.findAll({ where: { gateAreaId, eventTime: { [Op.gte]: earliest } } });
}

// A car park can never hold more cars than it has spaces.
function clampOccupancy(count, totalParks) {
  return Math.min(Math.max(count, 0), totalParks);
}

// If more cars are recorded than there are spaces, the ones due to leave first
// leave now. Returns the new length of stay for each of those events.
function overflowReleases(activeEvents, totalParks, now = new Date()) {
  const overflow = activeEvents.length - totalParks;
  if (overflow <= 0) return [];
  const endTime = (e) => new Date(e.eventTime).getTime() + e.durationMinutes * 60000;
  return [...activeEvents]
    .sort((a, b) => endTime(a) - endTime(b))
    .slice(0, overflow)
    .map((e) => ({
      id: e.id,
      durationMinutes: Math.max(Math.floor((now.getTime() - new Date(e.eventTime).getTime()) / 60000), 0),
    }));
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
  const occupiedCount = clampOccupancy(events.filter((event) => isCurrentlyParked(event, now)).length, gate.totalParks);
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
    const occupiedCount = clampOccupancy(events.filter((event) => isCurrentlyParked(event, bucketTime)).length, gate.totalParks);
    const occupancyPercent = Math.round((occupiedCount / gate.totalParks) * 100);
    const available = gate.totalParks - occupiedCount;
    series.push({ time: bucketTime, occupied: occupiedCount, available, occupancyPercent });
  }

  return { gateId: gate.id, gateName: gate.name, totalParks: gate.totalParks, series };
}

// Writes the early departures from overflowReleases, so the records themselves
// never show more cars than spaces. Returns how many cars were released.
async function enforceCapacity(gate, now = new Date()) {
  const events = await eventsSince(gate.id, now);
  const active = events.filter((event) => isCurrentlyParked(event, now));
  const releases = overflowReleases(active, gate.totalParks, now);
  for (const release of releases) {
    await ParkingEvent.update({ durationMinutes: release.durationMinutes }, { where: { id: release.id } });
  }
  return releases.length;
}

async function enforceAllCapacities(now = new Date()) {
  const gates = await GateArea.findAll();
  let released = 0;
  for (const gate of gates) released += await enforceCapacity(gate, now);
  return released;
}

module.exports = {
  isCurrentlyParked,
  getGateOccupancy,
  getOccupancySeries,
  clampOccupancy,
  overflowReleases,
  enforceCapacity,
  enforceAllCapacities,
};
