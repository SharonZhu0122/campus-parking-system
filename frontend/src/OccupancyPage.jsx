import { Fragment, useState } from 'react';
import FaqWidget from './FaqWidget';
import KeyDateBanner from './KeyDateBanner';
import campusMapImg from './assets/campus-map.webp';
import { CampusMapModal, GateMapModal } from './occupancy/MapModals';
import GateCard from './occupancy/GateCard';
import OccupancyTopBar from './occupancy/OccupancyTopBar';
import { useGateOccupancy } from './occupancy/useGateOccupancy';

// The campus map takes the third place in the grid, after the second gate card.
const CAMPUS_MAP_AFTER_INDEX = 1;

function CampusMapPanel({ onOpen }) {
  return (
    <aside className="campus-map-panel">
      <span className="gate-label">Campus Map</span>
      <button type="button" className="gate-map-thumb" onClick={onOpen}>
        <img src={campusMapImg} alt="University of Waikato campus map" />
      </button>
      <span className="occupancy-detail">Click to enlarge</span>
    </aside>
  );
}

function OccupancyPage(props) {
  const { gates, occupancyByGate, lastUpdated, error } = useGateOccupancy();
  const [campusMapOpen, setCampusMapOpen] = useState(false);
  const [activeGateMap, setActiveGateMap] = useState(null);

  return (
    <div className="occupancy-page occupancy-fit">
      <OccupancyTopBar {...props} />

      <main className="page-content">
        <h1>Parking Availability</h1>
        <p className="subtitle">
          {lastUpdated ? `Last updated at ${lastUpdated.toLocaleTimeString()}` : 'Loading current availability...'}
        </p>
        {error && <p className="error">{error}</p>}
        <KeyDateBanner />
        <div className="gate-grid">
          {gates.map((gate, index) => (
            <Fragment key={gate.id}>
              <GateCard gate={gate} occupancy={occupancyByGate[gate.id]} onShowMap={setActiveGateMap} />
              {index === CAMPUS_MAP_AFTER_INDEX && <CampusMapPanel onOpen={() => setCampusMapOpen(true)} />}
            </Fragment>
          ))}
        </div>
      </main>

      {campusMapOpen && <CampusMapModal onClose={() => setCampusMapOpen(false)} />}
      {activeGateMap && (
        <GateMapModal gate={activeGateMap.gate} location={activeGateMap.location} onClose={() => setActiveGateMap(null)} />
      )}
      <FaqWidget />
    </div>
  );
}

export default OccupancyPage;
