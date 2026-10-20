import { VIOLATION_LABELS, statusOf } from './vehicleLabels';

function ViolationRow({ violation }) {
  const status = statusOf(violation);
  return (
    <tr>
      <td>{new Date(violation.time).toLocaleString()}</td>
      <td>{violation.gate}</td>
      <td>{VIOLATION_LABELS[violation.violationType] || violation.violationType}</td>
      <td>
        <span className={`status-badge ${status.className}`}>{status.text}</span>
        {violation.notificationSent && <div className="resolution-note">Notified at {violation.notifiedContact}</div>}
      </td>
    </tr>
  );
}

function VehicleViolationsTable({ violations }) {
  return (
    <div className="table-wrapper">
      <table className="violations-table">
        <thead>
          <tr>
            <th>When</th>
            <th>Gate</th>
            <th>What was flagged</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {violations.map((violation) => (
            <ViolationRow key={violation.id} violation={violation} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default VehicleViolationsTable;
