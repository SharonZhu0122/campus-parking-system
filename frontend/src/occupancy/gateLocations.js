import gate1Thumb from '../assets/gate-maps/gate1-thumb.jpg';
import gate1Full from '../assets/gate-maps/gate1-full.jpg';
import gate2bThumb from '../assets/gate-maps/gate2b-thumb.jpg';
import gate2bFull from '../assets/gate-maps/gate2b-full.jpg';
import gate3aThumb from '../assets/gate-maps/gate3a-thumb.jpg';
import gate3aFull from '../assets/gate-maps/gate3a-full.jpg';
import gate3bThumb from '../assets/gate-maps/gate3b-thumb.jpg';
import gate3bFull from '../assets/gate-maps/gate3b-full.jpg';
import gate10Thumb from '../assets/gate-maps/gate10-thumb.jpg';
import gate10Full from '../assets/gate-maps/gate10-full.jpg';

// Verified against Google Maps: Gate 1 and Gate 2b have their own listings
// there. Gate 3A/3B and Gate 10 don't, so those link to the nearest named
// landmark instead — still close enough to be useful for wayfinding.
// Map thumbnails are generated from the official campus map with each gate's
// lot highlighted. Gate 1 is inferred: the striped lot on Knighton Road plus the
// two car parks above it (by the Student Village and Unirec), which together
// match Gate 1's capacity (487) — worth confirming.
export const GATE_LOCATIONS = {
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

export function mapsUrl(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

// Same thresholds as the colours on the Busy times page.
export function occupancyLevel(percent) {
  if (percent >= 90) return 'high';
  if (percent >= 50) return 'medium';
  return 'low';
}
