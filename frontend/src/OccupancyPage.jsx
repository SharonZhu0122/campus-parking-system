import { useEffect, useState } from 'react';
import { getGates, getGateOccupancy } from './api';
import FaqWidget from './FaqWidget';

const REFRESH_INTERVAL_MS = 5000;
const FRIENDLY_ERROR = 'Could not load parking data. Trying again shortly.';

// Verified against Google Maps: Gate 1 and Gate 2b have their own listings
// there. Gate 3A/3B and Gate 10 don't, so those link to the nearest named
// landmark instead — still close enough to be useful for wayfinding.
const GATE_LOCATIONS = {
  'Gate 1': {
    description: 'Off Knighton Road, by The Pā.',
    mapsQuery: 'University of Waikato Gate 1 Knighton Road Hamilton',
  },
  'Gate 2b': {
    description: 'Off Knighton Road, by the Academy of Performing Arts.',
    mapsQuery: 'Gate 2b Academy of Performing Arts Parking, University of Waikato',
  },
  'Gate 3A': {
    description: "Off Ruakura Road, near Don Llewellyn's on Campus.",
    mapsQuery: "Don Llewellyn's on Campus, University of Waikato",
  },
  'Gate 3B': {
    description: "Off Ruakura Road, near Don Llewellyn's on Campus.",
    mapsQuery: "Don Llewellyn's on Campus, University of Waikato",
  },
  'Gate 10': {
    description: 'Off Silverdale Road, near NIWA.',
    mapsQuery: 'University of Waikato Gate 10 Silverdale Road Hamilton',
  },
};

function mapsUrl(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function occupancyLevel(percent) {
  if (percent >= 90) return 'high';
  if (percent >= 50) return 'medium';
  return 'low';
}

function OccupancyPage({ username, role, onLoginClick, onAdminLoginClick, onAdminClick, onLogout }) {
  const [gates, setGates] = useState([]);
  const [occupancyByGate, setOccupancyByGate] = useState({});
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [openInfoGateId, setOpenInfoGateId] = useState(null);

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
              <button type="button" className="top-bar-link" onClick={onLogout}>
                Log out
              </button>
            </span>
          ) : (
            <span className="top-bar-actions">
              <button type="button" className="top-bar-link" onClick={onLoginClick}>
                Log in
              </button>
              <button type="button" className="top-bar-link admin-login-link" onClick={onAdminLoginClick}>
                Admin login
              </button>
            </span>
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
            const location = GATE_LOCATIONS[gate.name];
            const infoOpen = openInfoGateId === gate.id;
            return (
              <div key={gate.id} className="gate-card">
                {location && (
                  <div className="gate-info">
                    <button
                      type="button"
                      className="gate-info-button"
                      aria-label={`Where is ${gate.name}?`}
                      onClick={() => setOpenInfoGateId(infoOpen ? null : gate.id)}
                    >
                      i
                    </button>
                    {infoOpen && (
                      <div className="gate-info-popup">
                        <p>{location.description}</p>
                        <a href={mapsUrl(location.mapsQuery)} target="_blank" rel="noopener noreferrer">
                          Open in Google Maps
                        </a>
                      </div>
                    )}
                  </div>
                )}
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
                  </>
                ) : (
                  <span className="occupancy-detail">Loading...</span>
                )}
              </div>
            );
          })}
        </div>
      </main>
      <FaqWidget />
    </div>
  );
}

export default OccupancyPage;
