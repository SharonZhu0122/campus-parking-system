import campusMapImg from '../assets/campus-map.webp';
import { mapsUrl } from './gateLocations';

function CloseButton({ onClick }) {
  return (
    <button type="button" className="map-modal-close" onClick={onClick}>
      &times;
    </button>
  );
}

export function CampusMapModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="map-modal-box" onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose} />
        <img src={campusMapImg} alt="University of Waikato campus map" />
      </div>
    </div>
  );
}

// A gate's car park highlighted on the campus map, with where it is.
export function GateMapModal({ gate, location, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="map-modal-box gate-map-modal" onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose} />
        <img src={location.full} alt={`${gate.name} highlighted on campus map`} />
        <div className="gate-map-modal-footer">
          <strong>{gate.name}</strong>
          <p>{location.description}</p>
          <a href={mapsUrl(location.mapsQuery)} target="_blank" rel="noopener noreferrer">
            Open in Google Maps
          </a>
        </div>
      </div>
    </div>
  );
}
