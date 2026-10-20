import { COMPARE_TEXT, NEXT_HOUR, STATUS_TEXT, occupancyLevel } from './format';

// The car park right now: a plain status, the free spaces, and a note only
// when it is busier or quieter than usual or about to change.
function BusyNowCard({ gateName, totalParks, now }) {
  const compare = COMPARE_TEXT[now.comparison];
  const next = NEXT_HOUR[now.nextHour];

  return (
    <section className="busy-now" aria-label="Right now">
      <span className="gate-label">{gateName} right now</span>
      <span className={`busy-status status-${now.status}`}>{STATUS_TEXT[now.status]}</span>
      <span className={`occupancy-percent level-${occupancyLevel(now.occupancyPercent)}`}>{now.available}</span>
      <span className="pred-note">spaces free out of {totalParks}</span>
      {(compare || next) && (
        <p className="busy-notes">
          {compare && <span>{compare}</span>}
          {next && (
            <span>
              <span className="busy-arrow" aria-hidden="true">{next.arrow}</span>
              {next.text}
            </span>
          )}
        </p>
      )}
    </section>
  );
}

export default BusyNowCard;
