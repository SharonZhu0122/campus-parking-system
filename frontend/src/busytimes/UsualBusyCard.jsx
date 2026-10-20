import { tabButtonClass } from '../tabs';
import TypicalChart from './TypicalChart';
import { DAYS, adviceFor } from './format';

// The bars for the chosen day, with the days to choose from.
function UsualBusyCard({ hours, selectedDay, onDayChange, currentHour }) {
  const showingToday = currentHour !== null;

  return (
    <section className="busy-chart-card" aria-label="Usual busy times">
      <div className="busy-chart-head">
        <h2>Usually busy at</h2>
        <div className="busy-days" role="tablist">
          {DAYS.map((d) => (
            <button
              key={d.weekday}
              type="button"
              role="tab"
              aria-selected={selectedDay === d.weekday}
              className={tabButtonClass(selectedDay === d.weekday)}
              onClick={() => onDayChange(d.weekday)}
            >
              {d.short}
            </button>
          ))}
        </div>
      </div>
      <TypicalChart hours={hours} currentHour={showingToday ? currentHour : -1} />
      <p className="busy-advice">
        {adviceFor(hours)}
        {showingToday && <span className="busy-now-key"><i /> Now</span>}
      </p>
      <p className="busy-source">Typical pattern from simulated data. Times are New Zealand time.</p>
    </section>
  );
}

export default UsualBusyCard;
