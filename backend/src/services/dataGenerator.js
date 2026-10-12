const cron = require('node-cron');
const { GateArea, ParkingEvent, Violation } = require('../models');
const { checkViolations, isPaidHours } = require('./ruleEngine');
const config = require('./simulationConfig');
const { createGateModel, dayNoise } = require('./typicalDay');
const { getGateOccupancy, enforceAllCapacities } = require('./occupancy');
const { nzParts } = require('../utils/nzTime');
const { trimOpenViolations } = require('./violationHousekeeping');
const { generateValidPlateNumber, PLATE_REGEX } = require('../utils/plates');

// Whole number of new cars with the given average (Poisson), so some runs
// bring none and some bring several.
function sampleEventCount(mean) {
  if (mean <= 0) return 0;
  const limit = Math.exp(-mean);
  let count = 0;
  let product = Math.random();
  while (product > limit) {
    count += 1;
    product *= Math.random();
  }
  return count;
}

function pickParkType() {
  const total = config.PARK_TYPE_WEIGHTS.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * total;
  for (const item of config.PARK_TYPE_WEIGHTS) {
    if (random < item.weight) return item.type;
    random -= item.weight;
  }
  return 'standard';
}

function pickPaymentStatus(parkType, date) {
  if (parkType === 'motorbike' || !isPaidHours(date)) {
    return 'not_required';
  }
  return Math.random() < config.UNPAID_CHANCE ? 'unpaid' : 'paid';
}

function pickMobilityCardValid(parkType) {
  if (parkType !== 'mobility') return null;
  return Math.random() >= config.INVALID_MOBILITY_CARD_CHANCE;
}

function pickDurationMinutes() {
  const range = config.MAX_STAY_MINUTES - config.MIN_STAY_MINUTES + 1;
  return Math.floor(Math.random() * range) + config.MIN_STAY_MINUTES;
}

async function createRandomEvent(gate, now = new Date()) {
  const parkType = pickParkType();

  const event = await ParkingEvent.create({
    plateNumber: generateValidPlateNumber(),
    gateAreaId: gate.id,
    parkType,
    paymentStatus: pickPaymentStatus(parkType, now),
    mobilityCardValid: pickMobilityCardValid(parkType),
    eventTime: new Date(now.getTime() - Math.random() * config.TICK_MINUTES * 60000),
    durationMinutes: pickDurationMinutes(),
  });

  const violationTypes = checkViolations(event);
  for (const violationType of violationTypes) {
    await Violation.create({ parkingEventId: event.id, violationType });
  }

  return { event, violationTypes };
}

async function runGeneratorTick(now = new Date()) {
  const gates = await GateArea.findAll();
  const { weekday, hour, minute, dateKey } = nzParts(now);
  const noise = dayNoise(dateKey);

  const results = [];
  for (const gate of gates) {
    const model = createGateModel(gate);
    const mean = model.arrivalsPerMinute(weekday, hour * 60 + minute) * noise * config.TICK_MINUTES;

    // A full car park turns cars away.
    const { occupied } = await getGateOccupancy(gate.id);
    const room = Math.max(gate.totalParks - occupied, 0);
    const count = Math.min(sampleEventCount(mean), room);

    for (let i = 0; i < count; i++) {
      results.push(await createRandomEvent(gate, now));
    }
  }

  await enforceAllCapacities(now);
  await trimOpenViolations();
  return results;
}

function startDataGenerator() {
  cron.schedule('*/2 * * * *', () => {
    runGeneratorTick()
      .then((results) => console.log(`[generator tick] created ${results.length} event(s) at ${new Date().toISOString()}`))
      .catch((err) => console.error('Data generator error:', err));
  });
  console.log('Data generator started (runs every 2 minutes)');
}

module.exports = {
  startDataGenerator,
  runGeneratorTick,
  generateValidPlateNumber,
  sampleEventCount,
  PLATE_REGEX,
};
