// Campus time. The server may run in any time zone (Railway uses UTC), but
// "paid hours" and "busy times" mean New Zealand time.
const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Pacific/Auckland',
  weekday: 'short',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: 'numeric',
  minute: 'numeric',
  hourCycle: 'h23',
});

const WEEKDAY_NUMBERS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

// weekday: 0 = Sunday ... 6 = Saturday
function nzParts(date) {
  const parts = {};
  for (const { type, value } of formatter.formatToParts(date)) {
    parts[type] = value;
  }
  return {
    weekday: WEEKDAY_NUMBERS[parts.weekday],
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

module.exports = { nzParts };
