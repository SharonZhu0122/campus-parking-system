const {
  expectedOccupied,
  typicalWeek,
  describeNow,
  statusFor,
  compareWithUsual,
  nextHourTrend,
} = require('./typicalDay');
const { pickEventCount } = require('./dataGenerator');

const MONDAY = 1;
const SATURDAY = 6;

test('midweek lunchtime is much busier than the small hours or a weekend', () => {
  const lunch = expectedOccupied(MONDAY, 12 * 60 + 30, 5);
  expect(lunch).toBeGreaterThan(20);
  expect(lunch).toBeLessThan(32);
  expect(expectedOccupied(MONDAY, 3 * 60, 5)).toBeLessThan(lunch / 4);
  expect(expectedOccupied(SATURDAY, 12 * 60, 5)).toBeLessThan(lunch / 4);
});

test('fills up through the morning and empties after the paid hours end', () => {
  const at = (h) => expectedOccupied(MONDAY, h * 60, 5);
  expect(at(7)).toBeLessThan(at(9));
  expect(at(9)).toBeLessThan(at(12));
  expect(at(20)).toBeLessThan(at(16));
});

test('the weekly chart has 7 days of 24 hours and the busiest hour is 1', () => {
  const week = typicalWeek(5);
  expect(week).toHaveLength(7);
  week.forEach((day) => expect(day.hours).toHaveLength(24));
  const all = week.flatMap((d) => d.hours.map((h) => h.relative));
  expect(Math.max(...all)).toBe(1);
  expect(Math.min(...all)).toBeGreaterThanOrEqual(0);
});

test('matches the generator: the average cars per run agrees with the model', () => {
  const runs = 20000;
  const paid = new Date('2026-10-12T12:00:00+13:00');
  const night = new Date('2026-10-12T23:00:00+13:00');
  let paidTotal = 0;
  let nightTotal = 0;
  for (let i = 0; i < runs; i++) {
    paidTotal += pickEventCount(paid);
    nightTotal += pickEventCount(night);
  }
  expect(paidTotal / runs).toBeGreaterThan(1.9);
  expect(paidTotal / runs).toBeLessThan(2.1);
  expect(nightTotal / runs).toBeGreaterThan(0.26);
  expect(nightTotal / runs).toBeLessThan(0.34);
});

test('status words follow the main page thresholds', () => {
  expect(statusFor(10)).toBe('plenty');
  expect(statusFor(50)).toBe('getting_busy');
  expect(statusFor(89)).toBe('getting_busy');
  expect(statusFor(90)).toBe('almost_full');
});

test('comparing with usual ignores one or two cars', () => {
  expect(compareWithUsual(5, 3)).toBe('usual');
  expect(compareWithUsual(40, 26)).toBe('busier');
  expect(compareWithUsual(10, 26)).toBe('quieter');
  expect(compareWithUsual(26, 26)).toBe('usual');
});

test('next hour trend', () => {
  expect(nextHourTrend(5, 20)).toBe('busier');
  expect(nextHourTrend(26, 8)).toBe('quieter');
  expect(nextHourTrend(26, 27)).toBe('steady');
});

test('describeNow uses New Zealand time', () => {
  // 10:00 UTC on Monday is 23:00 in Auckland, so it should read as night, not midday.
  const night = describeNow({ occupied: 3, totalParks: 100, gateCount: 5, now: new Date('2026-10-12T10:00:00Z') });
  expect(night.hour).toBe(23);
  expect(night.weekday).toBe(MONDAY);
  const day = describeNow({ occupied: 20, totalParks: 100, gateCount: 5, now: new Date('2026-10-11T23:00:00Z') });
  expect(day.hour).toBe(12);
  expect(day.status).toBe('plenty');
  expect(day.available).toBe(80);
});
