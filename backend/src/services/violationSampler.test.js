const { randomViolationDetails, possibleTypes } = require('./violationSampler');
const { checkViolations } = require('./ruleEngine');

const PAID = new Date('2026-10-13T11:00:00+13:00'); // Tuesday morning in Auckland
const NIGHT = new Date('2026-10-13T23:00:00+13:00');

test('not paying is only possible during paid hours', () => {
  expect(possibleTypes(PAID)).toContain('unpaid_violation');
  expect(possibleTypes(NIGHT)).not.toContain('unpaid_violation');
  expect(possibleTypes(NIGHT)).toEqual(['reserved_violation', 'mobility_violation']);
});

test('every random violation is one the rule engine would really flag', () => {
  for (let i = 0; i < 300; i++) {
    const { violationType, event } = randomViolationDetails(i % 2 ? PAID : NIGHT);
    expect(checkViolations({ ...event, eventTime: event.eventTime })).toContain(violationType);
    expect(event.plateNumber).toMatch(/^[A-Z]{3}\d{3}$/);
  }
});

test('the cars were parked within the last three hours', () => {
  for (let i = 0; i < 100; i++) {
    const { event } = randomViolationDetails(PAID);
    const age = PAID.getTime() - event.eventTime.getTime();
    expect(age).toBeGreaterThanOrEqual(0);
    expect(age).toBeLessThanOrEqual(3 * 60 * 60 * 1000);
  }
});
