import { useState } from 'react';
import BrandMark from './BrandMark';
import ViolationForm from './admin/ViolationForm';
import ViolationsTable from './admin/ViolationsTable';
import ViolationsToolbar from './admin/ViolationsToolbar';
import { useViolations } from './admin/useViolations';

function notificationText(updated) {
  return updated.notificationSent
    ? `Notification sent to ${updated.notifiedContact}`
    : 'No registered contact found for this plate. Notification not sent.';
}

function NotificationDialog({ message, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <p>{message}</p>
        <button type="button" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
}

function AdminTopBar({ onBack, onPredictionsClick, onInquiriesClick }) {
  return (
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
  );
}

function AdminPage({ onBack, onPredictionsClick, onInquiriesClick }) {
  const [formMode, setFormMode] = useState(null); // null, 'add' or the violation being edited
  const [notification, setNotification] = useState(null);
  const data = useViolations({ paused: Boolean(formMode) || Boolean(notification) });

  async function handleResolve(id, resolutionType) {
    if (!resolutionType) {
      data.setError('Choose how this was handled before resolving it.');
      return;
    }
    try {
      const updated = await data.resolve(id, resolutionType);
      if (resolutionType === 'ticket_issued') setNotification(notificationText(updated));
    } catch (err) {
      data.setError(err.message);
    }
  }

  function handleSaved() {
    setFormMode(null);
    data.setError('');
    data.load();
  }

  return (
    <div className="occupancy-page">
      <AdminTopBar onBack={onBack} onPredictionsClick={onPredictionsClick} onInquiriesClick={onInquiriesClick} />

      <main className="page-content admin-content">
        <h1>Violations</h1>
        <p className="subtitle">{data.loading ? 'Loading...' : `${data.totals.unresolved} waiting to be handled`}</p>
        {data.error && <p className="error">{data.error}</p>}
        {!data.loading && (
          <>
            <ViolationsToolbar
              tab={data.tab}
              onTabChange={data.setTab}
              totals={data.totals}
              shown={data.violations.length}
              lastUpdated={data.lastUpdated}
              updating={data.updating}
              onUpdate={data.fillWithSamples}
              onAdd={() => setFormMode('add')}
            />
            <ViolationsTable violations={data.violations} onResolve={handleResolve} onEdit={setFormMode} />
          </>
        )}
      </main>

      {formMode && (
        <ViolationForm
          gates={data.gates}
          editing={formMode === 'add' ? null : formMode}
          onClose={() => setFormMode(null)}
          onSaved={handleSaved}
        />
      )}
      {notification && <NotificationDialog message={notification} onClose={() => setNotification(null)} />}
    </div>
  );
}

export default AdminPage;
