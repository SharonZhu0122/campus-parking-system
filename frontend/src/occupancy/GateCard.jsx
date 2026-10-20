import { GATE_LOCATIONS, occupancyLevel } from './gateLocations';

// One gate: free spaces, a fill bar, and a map thumbnail that opens larger.
function GateCard({ gate, occupancy, onShowMap }) {
  const location = GATE_LOCATIONS[gate.name];
  const percent = occupancy ? occupancy.occupancyPercent : 0;
  const level = occupancyLevel(percent);
  const available = occupancy ? occupancy.totalParks - occupancy.occupied : null;

  return (
    <div className="gate-card">
      <span className="gate-label">{gate.name}</span>
      {occupancy ? (
        <>
          <span className={`occupancy-percent level-${level}`}>{available}</span>
          <span className="available-label">spaces available</span>
          <div className="occupancy-bar">
            <div className={`occupancy-bar-fill level-${level}`} style={{ width: `${Math.min(percent, 100)}%` }} />
          </div>
        </>
      ) : (
        <span className="occupancy-detail">Loading...</span>
      )}
      {location?.thumb && (
        <button
          type="button"
          className="gate-map-thumb"
          onClick={() => onShowMap({ gate, location })}
          aria-label={`Show ${gate.name} on the campus map`}
        >
          <img src={location.thumb} alt={`${gate.name} location on campus map`} />
        </button>
      )}
    </div>
  );
}

export default GateCard;
