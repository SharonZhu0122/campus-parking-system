import { useState } from 'react';
import { updateProfile } from '../api';
import FormField from '../components/FormField';

// Plate, email and phone. Parking staff use these to notify the driver.
function ProfileForm({ profile, onSaved }) {
  const [plateNumber, setPlateNumber] = useState(profile.plateNumber || '');
  const [contactEmail, setContactEmail] = useState(profile.contactEmail || '');
  const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber || '');
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const saved = await updateProfile({ plateNumber, contactEmail, phoneNumber });
      onSaved(saved);
      setPlateNumber(saved.plateNumber || '');
      setMessage({ type: 'success', text: 'Your details have been saved.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="account-card" onSubmit={handleSubmit}>
      <h2>Vehicle and contact</h2>
      <p className="account-hint">Parking staff use these details to notify you if your vehicle is flagged.</p>
      <FormField id="acc-plate" label="Vehicle plate number" type="text" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} maxLength={8} required />
      <FormField id="acc-email" label="Contact email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
      <FormField id="acc-phone" label="Contact phone number" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
      {message && <p className={message.type}>{message.text}</p>}
      <button type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save changes'}
      </button>
    </form>
  );
}

export default ProfileForm;
