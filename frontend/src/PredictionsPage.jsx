import BrandMark from './BrandMark';
import KeyDateBanner from './KeyDateBanner';
import BusyNowCard from './busytimes/BusyNowCard';
import ForecastDetails from './busytimes/ForecastDetails';
import UsualBusyCard from './busytimes/UsualBusyCard';
import { useBusyTimes } from './busytimes/useBusyTimes';

// The title, the gate to look at, and the refresh button.
function Toolbar({ gates, gateId, onGateChange, loading, onRefresh, lastUpdated }) {
  return (
    <div className="pred-toolbar">
      <div className="pred-heading">
        <h1>Busy times</h1>
        <p className="subtitle">How full each car park is now, and when it is usually busy.</p>
      </div>
      <div className="pred-controls">
        <div className="field">
          <label htmlFor="gate-select">Gate</label>
          <select id="gate-select" value={gateId} onChange={(e) => onGateChange(e.target.value)}>
            {gates.map((gate) => (
              <option key={gate.id} value={gate.id}>
                {gate.name}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="link-button" onClick={onRefresh} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
        {lastUpdated && <span className="pred-updated">Updated {lastUpdated.toLocaleTimeString()}</span>}
      </div>
    </div>
  );
}

function PredictionsPage({ onBack, backLabel = 'Back to occupancy' }) {
  const page = useBusyTimes();
  const { busy, day } = page;

  const hoursForDay = busy && day !== null ? busy.typicalWeek.find((d) => d.weekday === day).hours : [];
  const currentHour = busy && day === busy.now.weekday ? busy.now.hour : null;

  return (
    <div className="occupancy-page">
      <header className="top-bar">
        <div className="top-bar-inner">
          <BrandMark />
          <button type="button" className="top-bar-link" onClick={onBack}>
            {backLabel}
          </button>
        </div>
      </header>

      <main className="page-content admin-content">
        <Toolbar
          gates={page.gates}
          gateId={page.gateId}
          onGateChange={page.chooseGate}
          loading={page.loading}
          onRefresh={page.refresh}
          lastUpdated={page.lastUpdated}
        />
        {page.error && <p className="error">{page.error}</p>}
        <KeyDateBanner />

        {busy && (
          <div className="busy-grid">
            <BusyNowCard gateName={busy.gateName} totalParks={busy.totalParks} now={busy.now} />
            <UsualBusyCard hours={hoursForDay} selectedDay={day} onDayChange={page.setDay} currentHour={currentHour} />
          </div>
        )}
        {page.forecast && <ForecastDetails data={page.forecast} />}
      </main>
    </div>
  );
}

export default PredictionsPage;
