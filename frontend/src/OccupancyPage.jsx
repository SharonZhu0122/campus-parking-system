import { useEffect, useState } from 'react';
import { getGates, getGateOccupancy } from './api';

const REFRESH_INTERVAL_MS = 5000;

function OccupancyPage({ username }) {
  const [gates, setGates] = useState([]);
  const [occupancyByGate, setOccupancyByGate] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    getGates()
      .then(setGates)
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (gates.length === 0) return undefined;

    async function refreshOccupancy() {
      try {
        const results = await Promise.all(gates.map((gate) => getGateOccupancy(gate.id)));
        const next = {};
        results.forEach((result) => {
          next[result.gateId] = result;
        });
        setOccupancyByGate(next);
      } catch (err) {
        setError(err.message);
      }
    }

    refreshOccupancy();
    const intervalId = setInterval(refreshOccupancy, REFRESH_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [gates]);

  return (
    <div className="occupancy-page">
      <h1>Gate Occupancy</h1>
      <p className="subtitle">
        Logged in as {username}. Updates every {REFRESH_INTERVAL_MS / 1000} seconds.
      </p>
      {error && <p className="error">{error}</p>}
      <div className="gate-grid">
        {gates.map((gate) => {
          const occupancy = occupancyByGate[gate.id];
          return (
            <div key={gate.id} className="gate-card">
              <h2>{gate.name}</h2>
              {occupancy ? (
                <>
                  <p className="occupancy-percent">{occupancy.occupancyPercent}%</p>
                  <p className="occupancy-detail">
                    {occupancy.occupied} / {occupancy.totalParks} parks occupied
                  </p>
                </>
              ) : (
                <p className="occupancy-detail">Loading...</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default OccupancyPage;
