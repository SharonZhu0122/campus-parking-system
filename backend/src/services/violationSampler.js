const { GateArea, ParkingEvent, Violation } = require('../models');
const { isPaidHours } = require('./ruleEngine');
const { VIOLATION_TYPES, EVENT_FOR_TYPE } = require('./violationTypes');
const { generateValidPlateNumber } = require('../utils/plates');
const { SAMPLE_BATCH_SIZE } = require('./simulationConfig');

const SAMPLE_WINDOW_MINUTES = 3 * 60;

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// Not paying only counts as a violation during paid hours.
function possibleTypes(eventTime) {
  return VIOLATION_TYPES.filter((type) => type !== 'unpaid_violation' || isPaidHours(eventTime));
}

function randomViolationDetails(now = new Date()) {
  const eventTime = new Date(now.getTime() - Math.random() * SAMPLE_WINDOW_MINUTES * 60000);
  const violationType = pick(possibleTypes(eventTime));
  return {
    violationType,
    event: {
      plateNumber: generateValidPlateNumber(),
      ...EVENT_FOR_TYPE[violationType],
      eventTime,
      // A detection, not a parked car in the occupancy figures: it must not fill the car park.
      durationMinutes: 1,
    },
  };
}

// Replace the open detections from the rule engine with a fresh batch of random
// ones. Violations staff entered, and anything already handled, are kept.
async function replaceOpenViolations(count = SAMPLE_BATCH_SIZE, now = new Date()) {
  const gates = await GateArea.findAll();
  if (gates.length === 0) return 0;

  await Violation.destroy({ where: { resolved: false, source: 'automatic' } });

  for (let i = 0; i < count; i++) {
    const { violationType, event } = randomViolationDetails(now);
    const created = await ParkingEvent.create({ ...event, gateAreaId: pick(gates).id });
    await Violation.create({ violationType, parkingEventId: created.id, source: 'automatic', createdAt: event.eventTime });
  }
  return count;
}

module.exports = { randomViolationDetails, possibleTypes, replaceOpenViolations };
