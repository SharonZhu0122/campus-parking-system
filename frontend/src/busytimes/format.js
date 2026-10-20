// Words, labels and small helpers for the Busy times page.

export const DAYS = [
  { weekday: 1, short: 'Mon', long: 'Monday' },
  { weekday: 2, short: 'Tue', long: 'Tuesday' },
  { weekday: 3, short: 'Wed', long: 'Wednesday' },
  { weekday: 4, short: 'Thu', long: 'Thursday' },
  { weekday: 5, short: 'Fri', long: 'Friday' },
  { weekday: 6, short: 'Sat', long: 'Saturday' },
  { weekday: 0, short: 'Sun', long: 'Sunday' },
];

export const STATUS_TEXT = {
  plenty: 'Plenty of space',
  getting_busy: 'Getting busy',
  almost_full: 'Almost full',
};

// Only worth saying when something is out of the ordinary.
export const COMPARE_TEXT = {
  busier: 'Busier than usual',
  quieter: 'Quieter than usual',
};

export const NEXT_HOUR = {
  busier: { arrow: '↗', text: 'Getting busier' },
  quieter: { arrow: '↘', text: 'Getting quieter' },
};

// Colours of the lines and markers on the trend chart.
export const COLORS = {
  history: '#32373d',
  movingAverage: '#faa61a',
  linearRegression: '#aa0000',
};

export const METHOD_LABELS = {
  moving_average: 'Moving average',
  linear_regression: 'Linear regression',
};

// Same thresholds as the colours on the main page.
export function occupancyLevel(percent) {
  if (percent >= 90) return 'high';
  if (percent >= 50) return 'medium';
  return 'low';
}

// 0 to 23 as "12am", "3pm" and so on.
export function formatClock(hour) {
  const h = hour % 24;
  const suffix = h < 12 ? 'am' : 'pm';
  return `${h % 12 === 0 ? 12 : h % 12}${suffix}`;
}

export function formatHour(time) {
  return new Date(time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function busyWord(relative) {
  if (relative >= 0.7) return 'Busy';
  if (relative >= 0.3) return 'Moderate';
  return 'Quiet';
}

// One sentence about when this day is busiest.
export function adviceFor(hours) {
  const peak = Math.max(...hours.map((h) => h.relative));
  if (peak < 0.3) return 'Quiet all day.';
  const busy = hours.filter((h) => h.relative >= peak * 0.85).map((h) => h.hour);
  return `Usually busiest from ${formatClock(Math.min(...busy))} to ${formatClock(Math.max(...busy) + 1)}.`;
}
