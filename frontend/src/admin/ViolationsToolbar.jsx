import { tabButtonClass } from '../tabs';

function emptyMessage(tab) {
  return tab === 'open' ? 'Nothing is waiting. Every violation has been handled.' : 'No violations have been handled yet.';
}

// Tabs for Open and Handled, then the summary line and the buttons.
function ViolationsToolbar({ tab, onTabChange, totals, shown, lastUpdated, updating, onUpdate, onAdd }) {
  return (
    <>
      <div className="violations-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'open'} className={tabButtonClass(tab === 'open')} onClick={() => onTabChange('open')}>
          Open ({totals.unresolved})
        </button>
        <button type="button" role="tab" aria-selected={tab === 'resolved'} className={tabButtonClass(tab === 'resolved')} onClick={() => onTabChange('resolved')}>
          Handled ({totals.resolved})
        </button>
      </div>
      <div className="violations-toolbar">
        <span className="subtitle">
          {shown === 0 ? emptyMessage(tab) : `Showing the most recent ${shown}.`}
          {lastUpdated && <span className="admin-updated"> Updated {lastUpdated.toLocaleTimeString()}</span>}
        </span>
        <span className="violations-buttons">
          {tab === 'open' && (
            <button
              type="button"
              className="update-violations"
              onClick={onUpdate}
              disabled={updating}
              title="Replace the open detections with a fresh batch of 19 random ones"
            >
              {updating ? 'Updating...' : 'Update'}
            </button>
          )}
          <button type="button" className="add-violation" onClick={onAdd}>
            Add violation
          </button>
        </span>
      </div>
    </>
  );
}

export default ViolationsToolbar;
