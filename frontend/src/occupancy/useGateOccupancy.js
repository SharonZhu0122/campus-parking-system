import { useEffect, useState } from 'react';
import { getGateOccupancy, getGates } from '../api';

const REFRESH_INTERVAL_MS = 5000;
const FRIENDLY_ERROR = 'Could not load parking data. Trying again shortly.';

// The gate list, and the live occupancy of each gate, refreshed every 5 seconds.
export function useGateOccupancy() {
  const [gates, setGates] = useState([]);
  const [occupancyByGate, setOccupancyByGate] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getGates()
      .then(setGates)
      .catch(() => setError(FRIENDLY_ERROR));
  }, []);

  useEffect(() => {
    if (gates.length === 0) return undefined;

    async function refresh() {
      try {
        const results = await Promise.all(gates.map((gate) => getGateOccupancy(gate.id)));
        setOccupancyByGate(Object.fromEntries(results.map((result) => [result.gateId, result])));
        setLastUpdated(new Date());
        setError('');
      } catch {
        setError(FRIENDLY_ERROR);
      }
    }

    refresh();
    const id = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [gates]);

  return { gates, occupancyByGate, lastUpdated, error };
}
