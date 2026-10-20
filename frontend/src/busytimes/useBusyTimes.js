import { useCallback, useEffect, useState } from 'react';
import { getBusyness, getGates, getPredictions } from '../api';

const REFRESH_MS = 30000;
const RETRY_MS = 5000;

// The data behind the Busy times page: the gates, the chosen gate's busy times
// and forecast, and the day being looked at.
export function useBusyTimes() {
  const [gates, setGates] = useState([]);
  const [gateId, setGateId] = useState('');
  const [busy, setBusy] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [day, setDay] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    getGates()
      .then((list) => {
        setGates(list);
        if (list.length > 0) setGateId(String(list[0].id));
      })
      .catch((err) => setError(err.message));
  }, []);

  const load = useCallback(
    ({ silent = false } = {}) => {
      if (!gateId) return;
      if (!silent) setLoading(true);
      // The busy-times view does not depend on the forecast, so one failing
      // does not hide the other.
      Promise.allSettled([getBusyness(gateId), getPredictions(gateId)])
        .then(([busyResult, forecastResult]) => {
          if (busyResult.status === 'fulfilled') {
            setBusy(busyResult.value);
            setDay((current) => (current === null ? busyResult.value.now.weekday : current));
            setLastUpdated(new Date());
            setError('');
          } else {
            setError('Could not load busy times. Trying again shortly.');
          }
          if (forecastResult.status === 'fulfilled') setForecast(forecastResult.value);
        })
        .finally(() => setLoading(false));
    },
    [gateId]
  );

  useEffect(() => {
    load();
  }, [load]);

  // Keep the page current, and try again quickly after a failure (for example
  // while the server restarts).
  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden) load({ silent: true });
    }, error ? RETRY_MS : REFRESH_MS);
    return () => clearInterval(id);
  }, [load, error]);

  function chooseGate(id) {
    setGateId(id);
    setDay(null);
  }

  return { gates, gateId, chooseGate, busy, forecast, day, setDay, error, loading, lastUpdated, refresh: () => load() };
}
