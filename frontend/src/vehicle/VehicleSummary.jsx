function plural(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

// One line: how many violations there are and what became of them.
function VehicleSummary({ violations }) {
  const open = violations.filter((v) => !v.resolved).length;
  const tickets = violations.filter((v) => v.resolutionType === 'ticket_issued').length;
  const clear = violations.length === 0;

  return (
    <div className={`vehicle-summary ${clear ? 'clear' : 'flagged'}`}>
      {clear
        ? 'No violations on record for your vehicle.'
        : `${plural(violations.length, 'violation')} on record: ${open} under review, ${plural(tickets, 'ticket')} issued.`}
    </div>
  );
}

export default VehicleSummary;
