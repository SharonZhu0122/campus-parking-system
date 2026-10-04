const { getUpcomingAlerts } = require('./keyDates');

const events = [
  { name: 'Graduation', start: '2026-10-19', end: '2026-10-20' },
  { name: 'Trimester starts', start: '2026-11-16', end: '2026-11-16' },
];

test('shows nothing when no event is within 3 days', () => {
  expect(getUpcomingAlerts('2026-10-10', events)).toEqual([]);
});

test('starts warning exactly 3 days before an event', () => {
  expect(getUpcomingAlerts('2026-10-15', events)).toEqual([]);
  const alerts = getUpcomingAlerts('2026-10-16', events);
  expect(alerts).toHaveLength(1);
  expect(alerts[0].name).toBe('Graduation');
  expect(alerts[0].daysUntil).toBe(3);
});

test('keeps showing during a multi-day event and stops after it ends', () => {
  expect(getUpcomingAlerts('2026-10-19', events)[0].daysUntil).toBe(0);
  expect(getUpcomingAlerts('2026-10-20', events)[0].daysUntil).toBe(-1);
  expect(getUpcomingAlerts('2026-10-21', events)).toEqual([]);
});

test('works across a month boundary', () => {
  const alerts = getUpcomingAlerts('2026-11-13', events);
  expect(alerts[0].name).toBe('Trimester starts');
  expect(alerts[0].daysUntil).toBe(3);
});
