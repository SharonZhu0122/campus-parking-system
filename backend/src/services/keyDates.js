const { KEY_DATES } = require('../data/keyDates');

const LEAD_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

function toDayNumber(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return Math.round(Date.UTC(year, month - 1, day) / DAY_MS);
}

function todayInNewZealand(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Auckland' }).format(now);
}

// Events starting within the next LEAD_DAYS days, or already under way.
function getUpcomingAlerts(today = todayInNewZealand(), events = KEY_DATES) {
  const todayNumber = toDayNumber(today);
  return events
    .map((event) => ({
      ...event,
      daysUntil: toDayNumber(event.start) - todayNumber,
      endsInDays: toDayNumber(event.end) - todayNumber,
    }))
    .filter((event) => event.daysUntil <= LEAD_DAYS && event.endsInDays >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .map(({ endsInDays, ...event }) => event);
}

module.exports = { getUpcomingAlerts, todayInNewZealand, LEAD_DAYS };
