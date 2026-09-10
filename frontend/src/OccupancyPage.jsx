import { useEffect, useState } from 'react';
import { getGates, getGateOccupancy } from './api';

const REFRESH_INTERVAL_MS = 5000;

function occupancyLevel(percent) {
  if (percent >= 80) return 'high';
  if (percent >= 50) return 'medium';
  return 'low';
}

function OccupancyPage({ username, onLoginClick }) {
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
      <header className="top-bar">
        <div className="top-bar-inner">
          <span className="brand-mark">University of Waikato &middot; Parking</span>
          {username ? (
            <span className="user-status">Logged in as {username}</span>
          ) : (
            <button type="button" className="top-bar-link" onClick={onLoginClick}>
              Log in
            </button>
          )}
        </div>
      </header>

      <main className="page-content">
        <h1>Gate Occupancy</h1>
        <p className="subtitle">
          Live parking availability across campus. Updates every {REFRESH_INTERVAL_MS / 1000} seconds.
        </p>
        {error && <p className="error">{error}</p>}
        <div className="gate-grid">
          {gates.map((gate) => {
            const occupancy = occupancyByGate[gate.id];
            const percent = occupancy ? occupancy.occupancyPercent : 0;
            const level = occupancyLevel(percent);
            return (
              <div key={gate.id} className="gate-card">
                <span className="gate-label">{gate.name}</span>
                {occupancy ? (
                  <>
                    <span className={`occupancy-percent level-${level}`}>{percent}%</span>
                    <div className="occupancy-bar">
                      <div
                        className={`occupancy-bar-fill level-${level}`}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                    <span className="occupancy-detail">
                      {occupancy.occupied} / {occupancy.totalParks} parks occupied
                    </span>
                  </>
                ) : (
                  <span className="occupancy-detail">Loading...</span>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default OccupancyPage;
