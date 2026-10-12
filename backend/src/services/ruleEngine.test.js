const { checkViolations, isPaidHours } = require('./ruleEngine');

test('flags a car in a reserved park', () => {
  const event = {
    parkType: 'reserved',
    paymentStatus: 'paid',
    mobilityCardValid: null,
    eventTime: '2026-08-10T10:00:00+12:00',
  };
  expect(checkViolations(event)).toContain('reserved_violation');
});

test('flags an unpaid car during paid hours', () => {
  const event = {
    parkType: 'standard',
    paymentStatus: 'unpaid',
    mobilityCardValid: null,
    eventTime: '2026-08-10T10:00:00+12:00',
  };
  expect(checkViolations(event)).toContain('unpaid_violation');
});

test('does not flag a normal valid case', () => {
  const event = {
    parkType: 'standard',
    paymentStatus: 'paid',
    mobilityCardValid: null,
    eventTime: '2026-08-10T10:00:00+12:00',
  };
  expect(checkViolations(event)).toEqual([]);
});

test('does not flag an unpaid motorbike during paid hours', () => {
  const event = {
    parkType: 'motorbike',
    paymentStatus: 'unpaid',
    mobilityCardValid: null,
    eventTime: '2026-08-10T10:00:00+12:00',
  };
  expect(checkViolations(event)).toEqual([]);
});

describe('paid hours follow New Zealand time, whatever the server clock says', () => {
  test('Monday 10am in Auckland is paid', () => {
    expect(isPaidHours(new Date('2026-10-12T10:00:00+13:00'))).toBe(true);
  });

  test('the same instant is paid even though it is Sunday evening in UTC', () => {
    expect(new Date('2026-10-12T10:00:00+13:00').getUTCDay()).toBe(0);
    expect(isPaidHours(new Date('2026-10-11T21:00:00Z'))).toBe(true);
  });

  test('10am UTC on Monday is 11pm in Auckland, so it is not paid', () => {
    expect(isPaidHours(new Date('2026-10-12T10:00:00Z'))).toBe(false);
  });

  test('starts at 8:30am and ends at 4:30pm', () => {
    expect(isPaidHours(new Date('2026-10-12T08:29:00+13:00'))).toBe(false);
    expect(isPaidHours(new Date('2026-10-12T08:30:00+13:00'))).toBe(true);
    expect(isPaidHours(new Date('2026-10-12T16:30:00+13:00'))).toBe(true);
    expect(isPaidHours(new Date('2026-10-12T16:31:00+13:00'))).toBe(false);
  });

  test('weekends are never paid', () => {
    expect(isPaidHours(new Date('2026-10-17T12:00:00+13:00'))).toBe(false);
  });

  test('works across the daylight-saving change (NZST in winter)', () => {
    expect(isPaidHours(new Date('2026-08-10T10:00:00+12:00'))).toBe(true);
    expect(isPaidHours(new Date('2026-08-09T22:00:00Z'))).toBe(true);
  });
});
