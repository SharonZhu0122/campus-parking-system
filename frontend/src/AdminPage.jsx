import { useEffect, useState } from 'react';
import { createViolation, getGates, getViolations, getViolationSummary, resolveViolation, updateViolation } from './api';
import BrandMark from './BrandMark';

const REFRESH_MS = 10000;

const VIOLATION_OPTIONS = Object.entries({
  reserved_violation: 'Reserved space violation',
  unpaid_violation: 'Unpaid during paid hours',
  mobility_violation: 'Mobility park violation',
});

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

// Used both to add a violation found on patrol and to correct an open one.
function ViolationForm({ gates, editing, onClose, onSaved }) {
  const isEdit = Boolean(editing);
  const [plateNumber, setPlateNumber] = useState(isEdit ? editing.ParkingEvent.plateNumber : '');
  const [gateAreaId, setGateAreaId] = useState(gates[0] ? String(gates[0].id) : '');
  const [violationType, setViolationType] = useState(isEdit ? editing.violationType : 'reserved_violation');
  const [note, setNote] = useState(isEdit ? editing.note || '' : '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const saved = isEdit
        ? await updateViolation(editing.id, { plateNumber, violationType, note })
        : await createViolation({ plateNumber, gateAreaId: Number(gateAreaId), violationType, note });
      onSaved(saved);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay">
      <form className="modal-box violation-form" onSubmit={handleSubmit}>
        <h2>{isEdit ? 'Edit violation' : 'Add violation'}</h2>
        <p className="violation-form-hint">
          {isEdit
            ? 'Correct a mistake in an open violation. Resolved violations cannot be edited.'
            : 'Record something you found on patrol. It can be resolved like any other violation.'}
        </p>
        <div className="field">
          <label htmlFor="vf-plate">Plate number</label>
          <input id="vf-plate" type="text" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} maxLength={8} required />
        </div>
        {!isEdit && (
          <div className="field">
            <label htmlFor="vf-gate">Gate</label>
            <select id="vf-gate" value={gateAreaId} onChange={(e) => setGateAreaId(e.target.value)}>
              {gates.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="field">
          <label htmlFor="vf-type">What was found</label>
          <select id="vf-type" value={violationType} onChange={(e) => setViolationType(e.target.value)}>
            {VIOLATION_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="vf-note">Note (optional)</label>
          <textarea id="vf-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={3} />
        </div>
        {error && <p className="error">{error}</p>}
        <div className="violation-form-actions">
          <button type="submit" disabled={saving}>{saving ? 'Saving...' : isEdit ? 'Save changes' : 'Add violation'}</button>
          <button type="button" className="link-button" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

function AdminPage({ onBack, onPredictionsClick, onInquiriesClick }) {
  const [violations, setViolations] = useState([]);
  const [totals, setTotals] = useState({ total: 0, unresolved: 0, resolved: 0 });
  const [tab, setTab] = useState('open'); // 'open' or 'resolved'
  const [lastUpdated, setLastUpdated] = useState(null);
  const [gates, setGates] = useState([]);
  const [formMode, setFormMode] = useState(null); // null, 'add' or a violation being edited
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingChoice, setPendingChoice] = useState({});
  const [notificationModal, setNotificationModal] = useState(null);

  function loadAll(status = tab, { silent = false } = {}) {
    return Promise.all([getViolations(status), getViolationSummary(), getGates()])
      .then(([data, summary, gateList]) => {
        setViolations(data);
        setTotals(summary);
        setGates(gateList);
        setLastUpdated(new Date());
        setLoading(false);
      })
      .catch((err) => {
        // A failed background refresh keeps what is already on screen.
        if (!silent) setError(err.message);
        setLoading(false);
      });
  }

  useEffect(() => {
    loadAll(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Pick up new violations without a reload, unless a form or message is open.
  const busyWithDialog = Boolean(formMode) || Boolean(notificationModal);
  useEffect(() => {
    if (busyWithDialog) return undefined;
    const id = setInterval(() => {
      if (!document.hidden) loadAll(tab, { silent: true });
    }, REFRESH_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, busyWithDialog]);

  function handleSaved() {
    setFormMode(null);
    setError('');
    loadAll();
  }

  async function handleResolve(id) {
    const resolutionType = pendingChoice[id];
    if (!resolutionType) {
      setError('Choose how this was handled before resolving it.');
      return;
    }
    try {
      const updated = await resolveViolation(id, resolutionType);
      // A handled violation leaves the open list.
      setViolations((prev) => prev.filter((v) => v.id !== id));
      setTotals((prev) => ({ ...prev, unresolved: Math.max(prev.unresolved - 1, 0), resolved: prev.resolved + 1 }));
      setError('');
      if (resolutionType === 'ticket_issued') {
        setNotificationModal(
          updated.notificationSent
            ? `Notification sent to ${updated.notifiedContact}`
            : 'No registered contact found for this plate. Notification not sent.'
        );
      }
    } catch (err) {
      setError(err.message);
    }
  }


  return (
    <div className="occupancy-page">
      <header className="top-bar">
        <div className="top-bar-inner">
          <BrandMark />
          <div className="top-bar-actions">
            <button type="button" className="top-bar-link" onClick={onPredictionsClick}>
              Predictions
            </button>
            <button type="button" className="top-bar-link" onClick={onInquiriesClick}>
              Questions
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
          {loading ? 'Loading...' : `${totals.unresolved} waiting to be handled`}
        </p>
        {error && <p className="error">{error}</p>}
        <div className="violations-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'open'} className={`busy-day${tab === 'open' ? ' active' : ''}`} onClick={() => setTab('open')}>
            Open ({totals.unresolved})
          </button>
          <button type="button" role="tab" aria-selected={tab === 'resolved'} className={`busy-day${tab === 'resolved' ? ' active' : ''}`} onClick={() => setTab('resolved')}>
            Handled ({totals.resolved})
          </button>
        </div>
        {!loading && (
          <div className="violations-toolbar">
            <span className="subtitle">
              {violations.length === 0
                ? tab === 'open' ? 'Nothing is waiting. Every violation has been handled.' : 'No violations have been handled yet.'
                : `Showing the most recent ${violations.length}.`}
              {lastUpdated && <span className="admin-updated"> Updated {lastUpdated.toLocaleTimeString()}</span>}
            </span>
            <button type="button" className="add-violation" onClick={() => setFormMode('add')}>
              Add violation
            </button>
          </div>
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
                {violations.map((v) => (
                  <tr key={v.id}>
                    <td>{v.ParkingEvent.plateNumber}</td>
                    <td>{v.ParkingEvent.GateArea.name}</td>
                    <td>
                      {VIOLATION_LABELS[v.violationType] || v.violationType}
                      {v.note && <div className="resolution-note">Note: {v.note}</div>}
                      {v.source === 'manual' && (
                        <div className="resolution-note">Added by {v.createdBy} (patrol)</div>
                      )}
                      {v.editedBy && (
                        <div className="resolution-note">
                          Edited by {v.editedBy}, {new Date(v.editedAt).toLocaleString()}
                        </div>
                      )}
                    </td>
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
                                  Notification sent to {v.notifiedContact}
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
                          <button type="button" className="link-button" onClick={() => setFormMode(v)}>
                            Edit
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

      {formMode && (
        <ViolationForm
          gates={gates}
          editing={formMode === 'add' ? null : formMode}
          onClose={() => setFormMode(null)}
          onSaved={handleSaved}
        />
      )}

      {notificationModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <p>{notificationModal}</p>
            <button type="button" onClick={() => setNotificationModal(null)}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;
