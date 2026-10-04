import { useEffect, useState } from 'react';
import { getAlerts } from './api';

function formatDay(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-NZ', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).replace(',', '');
}

function describe(alert) {
  const range =
    alert.start === alert.end ? formatDay(alert.start) : `${formatDay(alert.start)} to ${formatDay(alert.end)}`;
  if (alert.daysUntil > 0) {
    const days = alert.daysUntil === 1 ? 'tomorrow' : `in ${alert.daysUntil} days`;
    return `${alert.name} ${days} (${range})`;
  }
  if (alert.daysUntil === 0) return `${alert.name} today (${range})`;
  return `${alert.name} under way (${range})`;
}

function KeyDateBanner() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    getAlerts()
      .then(setAlerts)
      .catch(() => setAlerts([]));
  }, []);

  if (alerts.length === 0) return null;

  return (
    <div className="key-date-banner" role="status">
      <span className="key-date-icon" aria-hidden="true">!</span>
      <span>
        <strong>Heads up:</strong> {alerts.map(describe).join('; ')}. Parking is likely to be busier than usual, so
        allow extra time.
      </span>
    </div>
  );
}

export default KeyDateBanner;
