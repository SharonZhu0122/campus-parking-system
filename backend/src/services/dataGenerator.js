const cron = require('node-cron');
const { GateArea, ParkingEvent, Violation } = require('../models');
const { checkViolations, isPaidHours } = require('./ruleEngine');

const PLATE_REGEX = /^[A-Z]{3}\d{3}$/;
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const PARK_TYPE_WEIGHTS = [
  { type: 'standard', weight: 70 },
  { type: 'reserved', weight: 10 },
  { type: 'mobility', weight: 10 },
  { type: 'motorbike', weight: 10 },
];

function generatePlateCandidate() {
  const letters = Array.from({ length: 3 }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)]).join('');
  const digitCount = Math.random() < 0.1 ? Math.floor(Math.random() * 3) + 1 : 3;
  const digits = Array.from({ length: digitCount }, () => Math.floor(Math.random() * 10)).join('');
  return letters + digits;
}

function generateValidPlateNumber() {
  let plate = generatePlateCandidate();
  while (!PLATE_REGEX.test(plate)) {
    plate = generatePlateCandidate();
  }
  return plate;
}

function pickEventCount(date) {
  if (isPaidHours(date)) {
    return Math.floor(Math.random() * 3) + 1;
  }
  return Math.random() < 0.3 ? 1 : 0;
}

function pickParkType() {
  const total = PARK_TYPE_WEIGHTS.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * total;
  for (const item of PARK_TYPE_WEIGHTS) {
    if (random < item.weight) return item.type;
    random -= item.weight;
  }
  return 'standard';
}

function pickPaymentStatus(parkType, date) {
  if (parkType === 'motorbike' || !isPaidHours(date)) {
    return 'not_required';
  }
  return Math.random() < 0.85 ? 'paid' : 'unpaid';
}

function pickMobilityCardValid(parkType) {
  if (parkType !== 'mobility') return null;
  return Math.random() < 0.85;
}

function pickDurationMinutes() {
  return Math.floor(Math.random() * (240 - 20 + 1)) + 20;
}

async function createRandomEvent(gate) {
  const now = new Date();
  const parkType = pickParkType();

  const event = await ParkingEvent.create({
    plateNumber: generateValidPlateNumber(),
    gateAreaId: gate.id,
    parkType,
    paymentStatus: pickPaymentStatus(parkType, now),
    mobilityCardValid: pickMobilityCardValid(parkType),
    eventTime: now,
    durationMinutes: pickDurationMinutes(),
  });

  const violationTypes = checkViolations(event);
  for (const violationType of violationTypes) {
    await Violation.create({ parkingEventId: event.id, violationType });
  }

  return { event, violationTypes };
}

async function runGeneratorTick() {
  const gates = await GateArea.findAll();
  if (gates.length === 0) return [];

  const gate = gates[Math.floor(Math.random() * gates.length)];
  const eventCount = pickEventCount(new Date());

  const results = [];
  for (let i = 0; i < eventCount; i++) {
    results.push(await createRandomEvent(gate));
  }
  return results;
}

function startDataGenerator() {
  cron.schedule('*/2 * * * *', () => {
    runGeneratorTick().catch((err) => console.error('Data generator error:', err));
  });
  console.log('Data generator started (runs every 2 minutes)');
}

module.exports = {
  startDataGenerator,
  runGeneratorTick,
  generateValidPlateNumber,
  PLATE_REGEX,
};
