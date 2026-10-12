const {
  createGateModel,
  describeNow,
  dayNoise,
  statusFor,
  compareWithUsual,
  nextHourTrend,
} = require('./typicalDay');
const { sampleEventCount } = require('./dataGenerator');

const SUN = 0;
const MON = 1;
const TUE = 2;
const FRI = 5;
const SAT = 6;

const gate1 = createGateModel({ name: 'Gate 1', totalParks: 487 });
const gate3b = createGateModel({ name: 'Gate 3B', totalParks: 60 });
const gate10 = createGateModel({ name: 'Gate 10', totalParks: 281 });

function busiest(model, weekday) {
  let best = 0;
  for (let minute = 0; minute < 1440; minute += 15) best = Math.max(best, model.expectedOccupied(weekday, minute));
  return best;
}

test('each gate peaks at its own share of capacity on the busiest day', () => {
  expect(busiest(gate1, TUE) / 487).toBeCloseTo(0.55, 1);
  expect(busiest(gate3b, TUE) / 60).toBeCloseTo(0.95, 1);
  expect(busiest(gate10, TUE) / 281).toBeCloseTo(0.3, 1);
});

test('small gates fill up more than big ones', () => {
  expect(busiest(gate3b, TUE) / 60).toBeGreaterThan(busiest(gate10, TUE) / 281);
});

test('days differ: Tuesday is busier than Friday, and weekends are quiet', () => {
  expect(busiest(gate1, TUE)).toBeGreaterThan(busiest(gate1, MON));
  expect(busiest(gate1, MON)).toBeGreaterThan(busiest(gate1, FRI));
  expect(busiest(gate1, FRI)).toBeGreaterThan(busiest(gate1, SAT));
  expect(busiest(gate1, SAT)).toBeGreaterThan(busiest(gate1, SUN));
});

test('fills up through the morning and empties after the afternoon', () => {
  const at = (h) => gate1.expectedOccupied(TUE, h * 60);
  expect(at(3)).toBeLessThan(at(8));
  expect(at(8)).toBeLessThan(at(10));
  expect(at(22)).toBeLessThan(at(15) / 3);
});

test('the weekly chart has 7 days of 24 hours, the busiest hour is 1, and weekdays differ', () => {
  const week = gate1.typicalWeek();
  expect(week).toHaveLength(7);
  week.forEach((day) => expect(day.hours).toHaveLength(24));
  const all = week.flatMap((d) => d.hours.map((h) => h.relative));
  expect(Math.max(...all)).toBe(1);
  expect(Math.min(...all)).toBeGreaterThanOrEqual(0);
  const monday = week[MON].hours.map((h) => h.relative).join();
  const friday = week[FRI].hours.map((h) => h.relative).join();
  expect(monday).not.toBe(friday);
});

test('sampleEventCount averages out to the requested mean', () => {
  const runs = 20000;
  let total = 0;
  for (let i = 0; i < runs; i++) total += sampleEventCount(2);
  expect(total / runs).toBeGreaterThan(1.9);
  expect(total / runs).toBeLessThan(2.1);
  expect(sampleEventCount(0)).toBe(0);
});

test('day noise is steady for a date, varies between dates and stays in range', () => {
  expect(dayNoise('2026-10-12')).toBe(dayNoise('2026-10-12'));
  const values = Array.from({ length: 30 }, (_, i) => dayNoise(`2026-10-${String(i + 1).padStart(2, '0')}`));
  values.forEach((v) => {
    expect(v).toBeGreaterThanOrEqual(0.85);
    expect(v).toBeLessThanOrEqual(1.15);
  });
  expect(new Set(values.map((v) => v.toFixed(3))).size).toBeGreaterThan(10);
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
  const night = describeNow({ occupied: 3, totalParks: 100, model: gate1, now: new Date('2026-10-12T10:00:00Z') });
  expect(night.hour).toBe(23);
  expect(night.weekday).toBe(MON);
  const day = describeNow({ occupied: 20, totalParks: 100, model: gate1, now: new Date('2026-10-11T23:00:00Z') });
  expect(day.hour).toBe(12);
  expect(day.status).toBe('plenty');
  expect(day.available).toBe(80);
});

test('violations are rare in the simulation', () => {
  const config = require('./simulationConfig');
  const total = config.PARK_TYPE_WEIGHTS.reduce((sum, w) => sum + w.weight, 0);
  const share = (type) => config.PARK_TYPE_WEIGHTS.find((w) => w.type === type).weight / total;
  // reserved is always a violation; unpaid and invalid mobility card are small chances
  const violationShare = share('reserved') + share('standard') * config.UNPAID_CHANCE + share('mobility') * config.INVALID_MOBILITY_CARD_CHANCE;
  expect(violationShare).toBeLessThan(0.02);
  expect(violationShare).toBeGreaterThan(0.003);
});
