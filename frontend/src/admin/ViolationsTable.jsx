import ViolationRow from './ViolationRow';

function ViolationsTable({ violations, onResolve, onEdit }) {
  return (
    <div className="table-wrapper">
      <table className="violations-table">
        <thead>
          <tr>
            <th>Plate</th>
            <th>Gate</th>
            <th>Violation</th>
            <th>Time</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {violations.map((violation) => (
            <ViolationRow key={violation.id} violation={violation} onResolve={onResolve} onEdit={onEdit} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ViolationsTable;
