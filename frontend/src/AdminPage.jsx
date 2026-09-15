import { useEffect, useState } from 'react';
import { getViolations, resolveViolation } from './api';

const DISPLAY_LIMIT = 100;

function AdminPage({ onBack }) {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    try {
      await resolveViolation(id);
      setViolations((prev) => prev.map((v) => (v.id === id ? { ...v, resolved: true } : v)));
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
          <button type="button" className="top-bar-link" onClick={onBack}>
            Back to occupancy
          </button>
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
                    <td>{v.violationType}</td>
                    <td>{new Date(v.createdAt).toLocaleString()}</td>
                    <td>
                      <span className={`status-badge ${v.resolved ? 'resolved' : 'unresolved'}`}>
                        {v.resolved ? 'Resolved' : 'Open'}
                      </span>
                    </td>
                    <td>
                      {!v.resolved && (
                        <button
                          type="button"
                          className="link-button"
                          onClick={() => handleResolve(v.id)}
                        >
                          Mark resolved
                        </button>
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
