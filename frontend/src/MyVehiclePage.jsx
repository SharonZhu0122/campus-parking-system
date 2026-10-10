import { useEffect, useState } from 'react';
import { getMyVehicle } from './api';
import BrandMark from './BrandMark';

const VIOLATION_LABELS = {
  reserved_violation: 'Reserved space without a permit',
  unpaid_violation: 'Unpaid during paid hours',
  mobility_violation: 'Mobility park without a valid card',
};

const RESOLUTION_LABELS = {
  ticket_issued: 'Ticket issued',
  false_positive: 'Closed: no violation found',
  other: 'Closed',
};

function statusOf(v) {
  if (!v.resolved) return { text: 'Under review', className: 'unresolved' };
  return { text: RESOLUTION_LABELS[v.resolutionType] || 'Closed', className: 'resolved' };
}

function MyVehiclePage({ onBack }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyVehicle()
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  const openCount = data ? data.violations.filter((v) => !v.resolved).length : 0;
  const ticketCount = data ? data.violations.filter((v) => v.resolutionType === 'ticket_issued').length : 0;

  return (
    <div className="occupancy-page">
      <header className="top-bar">
        <div className="top-bar-inner">
          <BrandMark />
          <button type="button" className="top-bar-link" onClick={onBack}>
            Back to occupancy
          </button>
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

            <div className={`vehicle-summary ${data.violations.length === 0 ? 'clear' : 'flagged'}`}>
              {data.violations.length === 0
                ? 'No violations on record for your vehicle.'
                : `${data.violations.length} violation${data.violations.length === 1 ? '' : 's'} on record: ${openCount} under review, ${ticketCount} ticket${ticketCount === 1 ? '' : 's'} issued.`}
            </div>

            {data.violations.length > 0 && (
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
                    {data.violations.map((v) => {
                      const status = statusOf(v);
                      return (
                        <tr key={v.id}>
                          <td>{new Date(v.time).toLocaleString()}</td>
                          <td>{v.gate}</td>
                          <td>{VIOLATION_LABELS[v.violationType] || v.violationType}</td>
                          <td>
                            <span className={`status-badge ${status.className}`}>{status.text}</span>
                            {v.notificationSent && (
                              <div className="resolution-note">Notified at {v.notifiedContact}</div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="vehicle-help">
              <strong>What should I do?</strong>
              <p>
                If your car has been clamped or you have a ticket, contact Unisafe Campus Security on 07 838 4444. This
                number came from an email thread with parking staff, so please double-check it is the right office.
                Violations are flagged by this demonstration system from simulated data and are reviewed by staff
                before any ticket is issued.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default MyVehiclePage;
