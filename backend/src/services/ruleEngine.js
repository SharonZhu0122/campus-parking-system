function isPaidHours(date) {
  const day = date.getDay();
  const isWeekday = day >= 1 && day <= 5;

  const minutesSinceMidnight = date.getHours() * 60 + date.getMinutes();
  const paidHoursStart = 8 * 60 + 30;
  const paidHoursEnd = 16 * 60 + 30;
  const isWithinPaidHours = minutesSinceMidnight >= paidHoursStart && minutesSinceMidnight <= paidHoursEnd;

  return isWeekday && isWithinPaidHours;
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

module.exports = { checkViolations, isPaidHours };
