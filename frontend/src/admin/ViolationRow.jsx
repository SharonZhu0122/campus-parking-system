import { useState } from 'react';
import { RESOLUTION_LABELS, VIOLATION_LABELS } from './violationLabels';

function formatTime(value) {
  return new Date(value).toLocaleString();
}

// What the staff wrote or did to this violation, under its type.
function ViolationHistory({ violation }) {
  return (
    <>
      {violation.note && <div className="resolution-note">Note: {violation.note}</div>}
      {violation.source === 'manual' && (
        <div className="resolution-note">Added by {violation.createdBy} (patrol)</div>
      )}
      {violation.editedBy && (
        <div className="resolution-note">
          Edited by {violation.editedBy}, {formatTime(violation.editedAt)}
        </div>
      )}
    </>
  );
}

// Who handled a resolved violation, how, and when.
function ResolutionNote({ violation }) {
  if (!violation.resolvedBy) {
    return <div className="resolution-note">Resolved before this detail was tracked</div>;
  }
  return (
    <div className="resolution-note">
      {RESOLUTION_LABELS[violation.resolutionType] || violation.resolutionType} by {violation.resolvedBy}
      <br />
      {formatTime(violation.resolvedAt)}
      {violation.notificationSent && (
        <>
          <br />
          Notification sent to {violation.notifiedContact}
        </>
      )}
    </div>
  );
}

// The choice, Resolve and Edit controls for an open violation.
function ResolveControls({ onResolve, onEdit }) {
  const [choice, setChoice] = useState('');

  return (
    <div className="resolve-action">
      <select value={choice} onChange={(e) => setChoice(e.target.value)}>
        <option value="">Choose action...</option>
        {Object.entries(RESOLUTION_LABELS).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      <button type="button" className="link-button" onClick={() => onResolve(choice)}>
        Resolve
      </button>
      <button type="button" className="link-button" onClick={onEdit}>
        Edit
      </button>
    </div>
  );
}

function ViolationRow({ violation, onResolve, onEdit }) {
  return (
    <tr>
      <td>{violation.ParkingEvent.plateNumber}</td>
      <td>{violation.ParkingEvent.GateArea.name}</td>
      <td>
        {VIOLATION_LABELS[violation.violationType] || violation.violationType}
        <ViolationHistory violation={violation} />
      </td>
      <td>{formatTime(violation.createdAt)}</td>
      <td>
        <span className={`status-badge ${violation.resolved ? 'resolved' : 'unresolved'}`}>
          {violation.resolved ? 'Resolved' : 'Open'}
        </span>
        {violation.resolved && <ResolutionNote violation={violation} />}
      </td>
      <td>
        {!violation.resolved && (
          <ResolveControls onResolve={(choice) => onResolve(violation.id, choice)} onEdit={() => onEdit(violation)} />
        )}
      </td>
    </tr>
  );
}

export default ViolationRow;
