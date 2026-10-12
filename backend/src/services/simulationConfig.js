// The numbers the data generator uses. The "typical day" chart is worked out
// from the same numbers, so the two always agree.
module.exports = {
  TICK_MINUTES: 2, // the generator runs every 2 minutes and picks one gate
  OFF_PEAK_CHANCE: 0.3, // outside paid hours: 30% chance of one new car per run
  PAID_EVENTS_MIN: 1, // inside paid hours: 1 to 3 new cars per run
  PAID_EVENTS_MAX: 3,
  MIN_STAY_MINUTES: 20,
  MAX_STAY_MINUTES: 240,
};
