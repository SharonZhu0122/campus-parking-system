const { nzParts } = require('../utils/nzTime');

const PAID_START = 8 * 60 + 30;
const PAID_END = 16 * 60 + 30;

// weekday: 0 = Sunday ... 6 = Saturday, minutes since midnight, New Zealand time
function isPaidSlot(weekday, minutesSinceMidnight) {
  const isWeekday = weekday >= 1 && weekday <= 5;
  return isWeekday && minutesSinceMidnight >= PAID_START && minutesSinceMidnight <= PAID_END;
}

function isPaidHours(date) {
  const { weekday, hour, minute } = nzParts(date);
  return isPaidSlot(weekday, hour * 60 + minute);
}

function checkViolations(event) {
  const violations = [];
  const eventDate = new Date(event.eventTime);

  if (event.parkType === 'reserved') {
    violations.push('reserved_violation');
  }

  if (isPaidHours(eventDate) && event.paymentStatus === 'unpaid' && event.parkType !== 'motorbike') {
    violations.push('unpaid_violation');
  }

  if (event.parkType === 'mobility' && event.mobilityCardValid === false) {
    violations.push('mobility_violation');
  }

  return violations;
}

module.exports = { checkViolations, isPaidHours, isPaidSlot };
