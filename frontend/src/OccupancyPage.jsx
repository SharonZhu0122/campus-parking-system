import { Fragment, useEffect, useState } from 'react';
import { getGates, getGateOccupancy } from './api';
import FaqWidget from './FaqWidget';
import campusMapImg from './assets/campus-map.webp';
import gate1Thumb from './assets/gate-maps/gate1-thumb.jpg';
import gate1Full from './assets/gate-maps/gate1-full.jpg';
import gate2bThumb from './assets/gate-maps/gate2b-thumb.jpg';
import gate2bFull from './assets/gate-maps/gate2b-full.jpg';
import gate3aThumb from './assets/gate-maps/gate3a-thumb.jpg';
import gate3aFull from './assets/gate-maps/gate3a-full.jpg';
import gate3bThumb from './assets/gate-maps/gate3b-thumb.jpg';
import gate3bFull from './assets/gate-maps/gate3b-full.jpg';
import gate10Thumb from './assets/gate-maps/gate10-thumb.jpg';
import gate10Full from './assets/gate-maps/gate10-full.jpg';
import BrandMark from './BrandMark';
import KeyDateBanner from './KeyDateBanner';

const REFRESH_INTERVAL_MS = 5000;
const FRIENDLY_ERROR = 'Could not load parking data. Trying again shortly.';

// Verified against Google Maps: Gate 1 and Gate 2b have their own listings
// there. Gate 3A/3B and Gate 10 don't, so those link to the nearest named
// landmark instead — still close enough to be useful for wayfinding.
// Map thumbnails are generated from the official campus map with each gate's
// lot highlighted. Gate 1's lot is inferred: it's the largest on the map and
// sits on Knighton Road, matching Gate 1's capacity (487) — worth confirming.
const GATE_LOCATIONS = {
  'Gate 1': {
    description: 'Off Knighton Road, by The Pā.',
    mapsQuery: 'University of Waikato Gate 1 Knighton Road Hamilton',
    thumb: gate1Thumb,
    full: gate1Full,
  },
  'Gate 2b': {
    description: 'Off Knighton Road, by the Academy of Performing Arts.',
    mapsQuery: 'Gate 2b Academy of Performing Arts Parking, University of Waikato',
    thumb: gate2bThumb,
    full: gate2bFull,
  },
  'Gate 3A': {
    description: "Off Ruakura Road, near Don Llewellyn's on Campus.",
    mapsQuery: "Don Llewellyn's on Campus, University of Waikato",
    thumb: gate3aThumb,
    full: gate3aFull,
  },
  'Gate 3B': {
    description: "Off Ruakura Road, near Don Llewellyn's on Campus.",
    mapsQuery: "Don Llewellyn's on Campus, University of Waikato",
    thumb: gate3bThumb,
    full: gate3bFull,
  },
  'Gate 10': {
    description: 'Off Silverdale Road, near NIWA. This car park is entered from Silverdale Road.',
    mapsQuery: 'University of Waikato Gate 10 Silverdale Road Hamilton',
    thumb: gate10Thumb,
    full: gate10Full,
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

function OccupancyPage({
  username,
  role,
  onLoginClick,
  onAdminLoginClick,
  onAdminClick,
  onMyVehicleClick,
  onPredictionsClick,
  onLogout,
}) {
  const [gates, setGates] = useState([]);
  const [occupancyByGate, setOccupancyByGate] = useState({});
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [activeGateMap, setActiveGateMap] = useState(null);

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
    <div className="occupancy-page occupancy-fit">
      <header className="top-bar">
        <div className="top-bar-inner">
          <BrandMark />
          {username ? (
            <span className="top-bar-actions">
              <span className="user-status">Logged in as {username}</span>
              <a
                className="top-bar-link pay-link"
                href="https://www.paymypark.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Pay for parking
              </a>
              {role === 'admin' && (
                <button type="button" className="top-bar-link" onClick={onAdminClick}>
                  Admin
                </button>
              )}
              {role !== 'admin' && (
                <button type="button" className="top-bar-link" onClick={onMyVehicleClick}>
                  My vehicle
                </button>
              )}
              <button type="button" className="top-bar-link" onClick={onPredictionsClick}>
                Predictions
              </button>
              <button type="button" className="top-bar-link" onClick={onLogout}>
                Log out
              </button>
            </span>
          ) : (
            <span className="top-bar-actions">
              <a
                className="top-bar-link pay-link"
                href="https://www.paymypark.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Pay for parking
              </a>
              <button type="button" className="top-bar-link" onClick={onLoginClick}>
                Log in
              </button>
              <button type="button" className="top-bar-link" onClick={onPredictionsClick}>
                Predictions
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
        <KeyDateBanner />
        <div className="gate-grid">
          {gates.map((gate, index) => {
            const occupancy = occupancyByGate[gate.id];
            const percent = occupancy ? occupancy.occupancyPercent : 0;
            const level = occupancyLevel(percent);
            const available = occupancy ? occupancy.totalParks - occupancy.occupied : null;
            const location = GATE_LOCATIONS[gate.name];
            return (
              <Fragment key={gate.id}>
                <div className="gate-card">
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
                  {location?.thumb && (
                    <button
                      type="button"
                      className="gate-map-thumb"
                      onClick={() => setActiveGateMap({ gate, location })}
                      aria-label={`Show ${gate.name} on the campus map`}
                    >
                      <img src={location.thumb} alt={`${gate.name} location on campus map`} />
                    </button>
                  )}
                </div>
                {index === 1 && (
                  <aside className="campus-map-panel">
                    <span className="gate-label">Campus Map</span>
                    <button
                      type="button"
                      className="gate-map-thumb"
                      onClick={() => setMapModalOpen(true)}
                    >
                      <img src={campusMapImg} alt="University of Waikato campus map" />
                    </button>
                    <span className="occupancy-detail">Click to enlarge</span>
                  </aside>
                )}
              </Fragment>
            );
          })}
        </div>
      </main>

      {mapModalOpen && (
        <div className="modal-overlay" onClick={() => setMapModalOpen(false)}>
          <div className="map-modal-box" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="map-modal-close"
              onClick={() => setMapModalOpen(false)}
            >
              &times;
            </button>
            <img src={campusMapImg} alt="University of Waikato campus map" />
          </div>
        </div>
      )}

      {activeGateMap && (
        <div className="modal-overlay" onClick={() => setActiveGateMap(null)}>
          <div className="map-modal-box gate-map-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="map-modal-close"
              onClick={() => setActiveGateMap(null)}
            >
              &times;
            </button>
            <img
              src={activeGateMap.location.full}
              alt={`${activeGateMap.gate.name} highlighted on campus map`}
            />
            <div className="gate-map-modal-footer">
              <strong>{activeGateMap.gate.name}</strong>
              <p>{activeGateMap.location.description}</p>
              <a
                href={mapsUrl(activeGateMap.location.mapsQuery)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in Google Maps
              </a>
            </div>
          </div>
        </div>
      )}

      <FaqWidget />
    </div>
  );
}

export default OccupancyPage;
