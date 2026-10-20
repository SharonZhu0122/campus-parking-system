import BrandMark from './BrandMark';
import VehicleSummary from './vehicle/VehicleSummary';
import VehicleViolationsTable from './vehicle/VehicleViolationsTable';
import { useMyVehicle } from './vehicle/useMyVehicle';

function WhatToDo() {
  return (
    <div className="vehicle-help">
      <strong>What should I do?</strong>
      <p>
        If your car has been clamped or you have a ticket, contact Unisafe Campus Security on 07 838 4444. This number
        came from an email thread with parking staff, so please double-check it is the right office. Violations are
        flagged by this demonstration system from simulated data and are reviewed by staff before any ticket is
        issued.
      </p>
    </div>
  );
}

function MyVehiclePage({ onBack, onAccountClick }) {
  const { data, error } = useMyVehicle();

  return (
    <div className="occupancy-page">
      <header className="top-bar">
        <div className="top-bar-inner">
          <BrandMark />
          <span className="top-bar-actions">
            <button type="button" className="top-bar-link" onClick={onAccountClick}>
              Account settings
            </button>
            <button type="button" className="top-bar-link" onClick={onBack}>
              Back to occupancy
            </button>
          </span>
        </div>
      </header>

      <main className="page-content admin-content">
        <h1>My vehicle</h1>
        {error && <p className="error">{error}</p>}

        {data && !data.plateNumber && (
          <p className="subtitle">
            No vehicle is registered on this account, so there is nothing to check yet. Register a new account with
            your plate number to use this page.
          </p>
        )}

        {data && data.plateNumber && (
          <>
            <p className="subtitle">
              Violations recorded for plate <strong className="plate-chip">{data.plateNumber}</strong>
            </p>
            <VehicleSummary violations={data.violations} />
            {data.violations.length > 0 && <VehicleViolationsTable violations={data.violations} />}
            <WhatToDo />
          </>
        )}
      </main>
    </div>
  );
}

export default MyVehiclePage;
