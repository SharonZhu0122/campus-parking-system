const { isPaidSlot } = require('./ruleEngine');
const { nzParts } = require('../utils/nzTime');
const config = require('./simulationConfig');

const MINUTES_PER_DAY = 24 * 60;
const STAY_VALUES = config.MAX_STAY_MINUTES - config.MIN_STAY_MINUTES + 1;

// How busy it is at this minute of the day, from the hourly shape, blending
// smoothly from one hour to the next.
function hourShape(minute) {
  const hour = Math.floor(minute / 60) % 24;
  const next = (hour + 1) % 24;
  const fraction = (minute % 60) / 60;
  return config.HOUR_SHAPE[hour] * (1 - fraction) + config.HOUR_SHAPE[next] * fraction;
}

function relativeArrivals(weekday, minute) {
  return config.DAY_FACTOR[weekday] * hourShape(minute);
}

// Chance that a car that arrived `lag` minutes ago is still parked.
function stillParked(lag) {
  if (lag > config.MAX_STAY_MINUTES) return 0;
  return Math.min(1, (config.MAX_STAY_MINUTES - lag + 1) / STAY_VALUES);
}

// Average cars parked per unit of arrival rate: arrivals over the last four
// hours, each weighted by the chance the car is still there.
function relativeOccupied(weekday, minute) {
  let total = 0;
  for (let lag = 0; lag <= config.MAX_STAY_MINUTES; lag++) {
    let arrivalMinute = minute - lag;
    let arrivalDay = weekday;
    if (arrivalMinute < 0) {
      arrivalMinute += MINUTES_PER_DAY;
      arrivalDay = (weekday + 6) % 7;
    }
    total += relativeArrivals(arrivalDay, arrivalMinute) * stillParked(lag);
  }
  return total;
}

let busiestRelative = null;
function busiestRelativeOccupied() {
  if (busiestRelative === null) {
    busiestRelative = 0;
    for (let weekday = 0; weekday < 7; weekday++) {
      for (let minute = 0; minute < MINUTES_PER_DAY; minute += 15) {
        busiestRelative = Math.max(busiestRelative, relativeOccupied(weekday, minute));
      }
    }
  }
  return busiestRelative;
}

// One gate's simulated behaviour. The scale is chosen so that its busiest
// hour fills the share of the gate set in PEAK_FILL.
function createGateModel(gate) {
  const peakFill = config.PEAK_FILL[gate.name] ?? config.DEFAULT_PEAK_FILL;
  const scale = (peakFill * gate.totalParks) / busiestRelativeOccupied();

  function expectedOccupied(weekday, minute) {
    return scale * relativeOccupied(weekday, minute);
  }

  function expectedForHour(weekday, hour) {
    const samples = [0, 15, 30, 45].map((m) => expectedOccupied(weekday, hour * 60 + m));
    return samples.reduce((a, b) => a + b, 0) / samples.length;
  }

  // Seven days of 24 hourly values. `relative` is the share of the busiest
  // hour of the whole week, so the bars can be compared between days.
  function typicalWeek() {
    const days = [];
    let weekMax = 0;
    for (let weekday = 0; weekday < 7; weekday++) {
      const hours = [];
      for (let hour = 0; hour < 24; hour++) {
        const value = expectedForHour(weekday, hour);
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

  return {
    scale,
    arrivalsPerMinute: (weekday, minute) => scale * relativeArrivals(weekday, minute),
    expectedOccupied,
    typicalWeek,
  };
}

// A fixed number between 1 - DAY_NOISE and 1 + DAY_NOISE for each calendar
// day, so every real day is a little different but the same day always gives
// the same answer.
function dayNoise(dateKey) {
  let hash = 0;
  for (const char of dateKey) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const fraction = (hash % 1000) / 999;
  return 1 + config.DAY_NOISE * (2 * fraction - 1);
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

function describeNow({ occupied, totalParks, model, now = new Date() }) {
  const { weekday, hour, minute } = nzParts(now);
  const later = nzParts(new Date(now.getTime() + 60 * 60 * 1000));
  const expectedNow = model.expectedOccupied(weekday, hour * 60 + minute);
  const expectedLater = model.expectedOccupied(later.weekday, later.hour * 60 + later.minute);
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

module.exports = { createGateModel, describeNow, dayNoise, statusFor, compareWithUsual, nextHourTrend, isPaidSlot };
