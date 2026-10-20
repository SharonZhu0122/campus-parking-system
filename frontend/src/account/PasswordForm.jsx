import { useState } from 'react';
import { changePassword } from '../api';
import FormField from '../components/FormField';

function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  function clearFields() {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'The new passwords do not match.' });
      return;
    }
    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      clearFields();
      setMessage({ type: 'success', text: 'Your password has been changed.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="account-card" onSubmit={handleSubmit}>
      <h2>Change password</h2>
      <p className="account-hint">Use at least 6 characters.</p>
      <FormField id="acc-current" label="Current password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
      <FormField id="acc-new" label="New password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
      <FormField id="acc-confirm" label="Confirm new password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
      {message && <p className={message.type}>{message.text}</p>}
      <button type="submit" disabled={saving}>
        {saving ? 'Updating...' : 'Update password'}
      </button>
    </form>
  );
}

export default PasswordForm;
