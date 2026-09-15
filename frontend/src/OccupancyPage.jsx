import { useEffect, useState } from 'react';
import { getGates, getGateOccupancy } from './api';

const REFRESH_INTERVAL_MS = 5000;
const FRIENDLY_ERROR = 'Could not load parking data. Trying again shortly.';

function occupancyLevel(percent) {
  if (percent >= 90) return 'high';
  if (percent >= 50) return 'medium';
  return 'low';
}

function OccupancyPage({ username, role, onLoginClick, onAdminClick }) {
  const [gates, setGates] = useState([]);
  const [occupancyByGate, setOccupancyByGate] = useState({});
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    getGates()
      .then(setGates)
      .catch(() => setError(FRIENDLY_ERROR));
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
        setLastUpdated(new Date());
        setError('');
      } catch {
        setError(FRIENDLY_ERROR);
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
            <span className="top-bar-actions">
              <span className="user-status">Logged in as {username}</span>
              {role === 'admin' && (
                <button type="button" className="top-bar-link" onClick={onAdminClick}>
                  Admin
                </button>
              )}
            </span>
          ) : (
            <button type="button" className="top-bar-link" onClick={onLoginClick}>
              Log in
            </button>
          )}
        </div>
      </header>

      <main className="page-content">
        <h1>Parking Availability</h1>
        <p className="subtitle">
          {lastUpdated
            ? `Last updated at ${lastUpdated.toLocaleTimeString()}`
            : 'Loading current availability...'}
        </p>
        {error && <p className="error">{error}</p>}
        <div className="gate-grid">
          {gates.map((gate) => {
            const occupancy = occupancyByGate[gate.id];
            const percent = occupancy ? occupancy.occupancyPercent : 0;
            const level = occupancyLevel(percent);
            const available = occupancy ? occupancy.totalParks - occupancy.occupied : null;
            return (
              <div key={gate.id} className="gate-card">
                <span className="gate-label">{gate.name}</span>
                {occupancy ? (
                  <>
                    <span className={`occupancy-percent level-${level}`}>{available}</span>
                    <span className="available-label">spaces available</span>
                    <div className="occupancy-bar">
                      <div
                        className={`occupancy-bar-fill level-${level}`}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                    <span className="occupancy-detail">
                      {occupancy.occupied} / {occupancy.totalParks} occupied
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
