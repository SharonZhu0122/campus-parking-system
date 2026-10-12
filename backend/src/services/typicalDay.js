const { isPaidSlot } = require('./ruleEngine');
const { nzParts } = require('../utils/nzTime');
const {
  TICK_MINUTES,
  OFF_PEAK_CHANCE,
  PAID_EVENTS_MIN,
  PAID_EVENTS_MAX,
  MIN_STAY_MINUTES,
  MAX_STAY_MINUTES,
} = require('./simulationConfig');

const MINUTES_PER_DAY = 24 * 60;
const STAY_VALUES = MAX_STAY_MINUTES - MIN_STAY_MINUTES + 1;
const MEAN_PAID_EVENTS = (PAID_EVENTS_MIN + PAID_EVENTS_MAX) / 2;

// Cars arriving per minute at one gate. Each run of the generator picks one of
// the gates at random, so every gate gets an equal share of the arrivals.
function arrivalsPerMinute(weekday, minute, gateCount) {
  const perRun = isPaidSlot(weekday, minute) ? MEAN_PAID_EVENTS : OFF_PEAK_CHANCE;
  return perRun / (TICK_MINUTES * gateCount);
}

// Chance that a car that arrived `lag` minutes ago is still parked.
function stillParked(lag) {
  if (lag > MAX_STAY_MINUTES) return 0;
  return Math.min(1, (MAX_STAY_MINUTES - lag + 1) / STAY_VALUES);
}

// How many cars the generator's rules leave in one gate at this moment, on
// average: arrivals over the last four hours, each weighted by the chance the
// car is still there.
function expectedOccupied(weekday, minute, gateCount) {
  let total = 0;
  for (let lag = 0; lag <= MAX_STAY_MINUTES; lag++) {
    let arrivalMinute = minute - lag;
    let arrivalDay = weekday;
    if (arrivalMinute < 0) {
      arrivalMinute += MINUTES_PER_DAY;
      arrivalDay = (weekday + 6) % 7;
    }
    total += arrivalsPerMinute(arrivalDay, arrivalMinute, gateCount) * stillParked(lag);
  }
  return total;
}

function expectedForHour(weekday, hour, gateCount) {
  const samples = [0, 15, 30, 45].map((m) => expectedOccupied(weekday, hour * 60 + m, gateCount));
  return samples.reduce((a, b) => a + b, 0) / samples.length;
}

// Seven days of 24 hourly values. `relative` is the share of the busiest hour
// of the whole week, so the bars can be compared between days.
function typicalWeek(gateCount) {
  const days = [];
  let weekMax = 0;
  for (let weekday = 0; weekday < 7; weekday++) {
    const hours = [];
    for (let hour = 0; hour < 24; hour++) {
      const value = expectedForHour(weekday, hour, gateCount);
      weekMax = Math.max(weekMax, value);
      hours.push({ hour, expectedOccupied: value });
    }
    days.push({ weekday, hours });
  }
  return days.map((day) => ({
    weekday: day.weekday,
    hours: day.hours.map((h) => ({
      hour: h.hour,
      expectedOccupied: Math.round(h.expectedOccupied * 10) / 10,
      relative: weekMax === 0 ? 0 : Math.round((h.expectedOccupied / weekMax) * 100) / 100,
    })),
  }));
}

function statusFor(occupancyPercent) {
  if (occupancyPercent >= 90) return 'almost_full';
  if (occupancyPercent >= 50) return 'getting_busy';
  return 'plenty';
}

// Compare the real number of cars with the usual number; a small absolute
// margin stops one or two cars from counting as "busier than usual".
function compareWithUsual(occupied, expected) {
  if (occupied >= expected * 1.3 + 2) return 'busier';
  if (occupied <= expected * 0.7 - 2) return 'quieter';
  return 'usual';
}

function nextHourTrend(expectedNow, expectedLater) {
  if (expectedLater >= expectedNow * 1.2 + 1) return 'busier';
  if (expectedLater <= expectedNow * 0.8 - 1) return 'quieter';
  return 'steady';
}

function describeNow({ occupied, totalParks, gateCount, now = new Date() }) {
  const { weekday, hour, minute } = nzParts(now);
  const later = nzParts(new Date(now.getTime() + 60 * 60 * 1000));
  const expectedNow = expectedOccupied(weekday, hour * 60 + minute, gateCount);
  const expectedLater = expectedOccupied(later.weekday, later.hour * 60 + later.minute, gateCount);
  const occupancyPercent = Math.round((occupied / totalParks) * 100);

  return {
    weekday,
    hour,
    occupied,
    available: totalParks - occupied,
    occupancyPercent,
    status: statusFor(occupancyPercent),
    expectedOccupied: Math.round(expectedNow * 10) / 10,
    comparison: compareWithUsual(occupied, expectedNow),
    nextHour: nextHourTrend(expectedNow, expectedLater),
  };
}

module.exports = { expectedOccupied, typicalWeek, describeNow, statusFor, compareWithUsual, nextHourTrend };
