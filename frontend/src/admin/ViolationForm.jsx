import { useState } from 'react';
import { createViolation, updateViolation } from '../api';
import { VIOLATION_OPTIONS } from './violationLabels';

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

export default ViolationForm;
