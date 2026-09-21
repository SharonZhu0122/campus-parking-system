import { useEffect, useState } from 'react';
import { getViolations, resolveViolation } from './api';

const DISPLAY_LIMIT = 100;

const RESOLUTION_LABELS = {
  ticket_issued: 'Ticket issued',
  false_positive: 'False positive',
  other: 'Other',
};

const VIOLATION_LABELS = {
  reserved_violation: 'Reserved space violation',
  unpaid_violation: 'Unpaid during paid hours',
  mobility_violation: 'Mobility park violation',
};

function AdminPage({ onBack, onPredictionsClick }) {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingChoice, setPendingChoice] = useState({});

  useEffect(() => {
    getViolations()
      .then((data) => {
        setViolations(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  async function handleResolve(id) {
    const resolutionType = pendingChoice[id];
    if (!resolutionType) {
      setError('Choose how this was handled before resolving it.');
      return;
    }
    try {
      const updated = await resolveViolation(id, resolutionType);
      setViolations((prev) => prev.map((v) => (v.id === id ? { ...v, ...updated } : v)));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  const unresolvedCount = violations.filter((v) => !v.resolved).length;
  const visible = violations.slice(0, DISPLAY_LIMIT);

  return (
    <div className="occupancy-page">
      <header className="top-bar">
        <div className="top-bar-inner">
          <span className="brand-mark">University of Waikato &middot; Parking</span>
          <div className="top-bar-actions">
            <button type="button" className="top-bar-link" onClick={onPredictionsClick}>
              Predictions
            </button>
            <button type="button" className="top-bar-link" onClick={onBack}>
              Back to occupancy
            </button>
          </div>
        </div>
      </header>

      <main className="page-content admin-content">
        <h1>Violations</h1>
        <p className="subtitle">
          {loading
            ? 'Loading...'
            : `${unresolvedCount} unresolved out of ${violations.length} total`}
        </p>
        {error && <p className="error">{error}</p>}
        {!loading && violations.length > DISPLAY_LIMIT && (
          <p className="subtitle">Showing the most recent {DISPLAY_LIMIT}.</p>
        )}
        {!loading && (
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
                {visible.map((v) => (
                  <tr key={v.id}>
                    <td>{v.ParkingEvent.plateNumber}</td>
                    <td>{v.ParkingEvent.GateArea.name}</td>
                    <td>{VIOLATION_LABELS[v.violationType] || v.violationType}</td>
                    <td>{new Date(v.createdAt).toLocaleString()}</td>
                    <td>
                      <span className={`status-badge ${v.resolved ? 'resolved' : 'unresolved'}`}>
                        {v.resolved ? 'Resolved' : 'Open'}
                      </span>
                      {v.resolved && (
                        <div className="resolution-note">
                          {v.resolvedBy ? (
                            <>
                              {RESOLUTION_LABELS[v.resolutionType] || v.resolutionType} by{' '}
                              {v.resolvedBy}
                              <br />
                              {new Date(v.resolvedAt).toLocaleString()}
                              {v.notificationSent && (
                                <>
                                  <br />
                                  Notification sent to registered owner
                                </>
                              )}
                            </>
                          ) : (
                            'Resolved before this detail was tracked'
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      {!v.resolved && (
                        <div className="resolve-action">
                          <select
                            value={pendingChoice[v.id] || ''}
                            onChange={(e) =>
                              setPendingChoice((prev) => ({ ...prev, [v.id]: e.target.value }))
                            }
                          >
                            <option value="">Choose action...</option>
                            <option value="ticket_issued">Ticket issued</option>
                            <option value="false_positive">False positive</option>
                            <option value="other">Other</option>
                          </select>
                          <button
                            type="button"
                            className="link-button"
                            onClick={() => handleResolve(v.id)}
                          >
                            Resolve
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminPage;
