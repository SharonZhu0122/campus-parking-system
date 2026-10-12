// The numbers behind the simulated car parks. The data generator and the
// "usually busy" chart both use these, so the chart is what the generator
// produces on an average day.
module.exports = {
  TICK_MINUTES: 2, // the generator runs every 2 minutes
  MIN_STAY_MINUTES: 20,
  MAX_STAY_MINUTES: 240,

  // How full each gate gets at its busiest hour of an ordinary busy day.
  PEAK_FILL: {
    'Gate 1': 0.55,
    'Gate 2b': 0.5,
    'Gate 3A': 0.8,
    'Gate 3B': 0.95,
    'Gate 10': 0.3,
  },
  DEFAULT_PEAK_FILL: 0.5,

  // Sunday to Saturday: how busy the day is compared with the busiest day.
  DAY_FACTOR: [0.1, 0.9, 1.0, 1.0, 0.9, 0.6, 0.15],

  // New Zealand clock hours 0 to 23: arrivals compared with the busiest hour.
  // Morning rush, a small lunchtime dip, an afternoon bump, a quiet evening.
  HOUR_SHAPE: [
    0.03, 0.03, 0.03, 0.03, 0.03, 0.03, 0.05, 0.1, 0.35, 0.75, 1.0, 0.95,
    0.8, 0.85, 0.95, 0.7, 0.4, 0.2, 0.1, 0.07, 0.05, 0.04, 0.03, 0.03,
  ],

  // Each real day is a little busier or quieter than the average day.
  DAY_NOISE: 0.15,

  // How the cars parked. Most park correctly, so violations are rare: about
  // one car in a hundred, or roughly twenty a day across the campus.
  PARK_TYPE_WEIGHTS: [
    { type: 'standard', weight: 97 },
    { type: 'reserved', weight: 0.5 }, // a car in a reserved bay is always a violation
    { type: 'mobility', weight: 1 },
    { type: 'motorbike', weight: 1.5 },
  ],
  UNPAID_CHANCE: 0.005, // during paid hours
  INVALID_MOBILITY_CARD_CHANCE: 0.15,

  // Detections nobody has handled expire, so the open list stays short.
  // Violations that staff entered themselves are never removed.
  MAX_OPEN_AUTOMATIC_VIOLATIONS: 19,

  // The admin's Update button puts this many fresh random violations on the list.
  SAMPLE_BATCH_SIZE: 19,
};
