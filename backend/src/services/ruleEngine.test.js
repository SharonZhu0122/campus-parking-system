const { checkViolations } = require('./ruleEngine');

test('flags a car in a reserved park', () => {
  const event = {
    parkType: 'reserved',
    paymentStatus: 'paid',
    mobilityCardValid: null,
    eventTime: '2026-08-10T10:00:00',
  };
  expect(checkViolations(event)).toContain('reserved_violation');
});

test('flags an unpaid car during paid hours', () => {
  const event = {
    parkType: 'standard',
    paymentStatus: 'unpaid',
    mobilityCardValid: null,
    eventTime: '2026-08-10T10:00:00',
  };
  expect(checkViolations(event)).toContain('unpaid_violation');
});

test('does not flag a normal valid case', () => {
  const event = {
    parkType: 'standard',
    paymentStatus: 'paid',
    mobilityCardValid: null,
    eventTime: '2026-08-10T10:00:00',
  };
  expect(checkViolations(event)).toEqual([]);
});

test('does not flag an unpaid motorbike during paid hours', () => {
  const event = {
    parkType: 'motorbike',
    paymentStatus: 'unpaid',
    mobilityCardValid: null,
    eventTime: '2026-08-10T10:00:00',
  };
  expect(checkViolations(event)).toEqual([]);
});
