import { useState } from 'react';
import { resetPassword } from './api';
import AuthLogo from './AuthLogo';

function ResetPasswordPage({ token, onDone }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, newPassword);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <AuthLogo />
      <h1>Choose a new password</h1>
      {done ? (
        <div className="login-form">
          <p className="form-success">Your password has been changed. You can now log in.</p>
          <button type="button" className="reset-login-button" onClick={onDone}>
            Go to log in
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="login-form">
          <p className="register-note">Use at least 6 characters.</p>
          <div className="field">
            <label htmlFor="reset-new">New password</label>
            <input
              id="reset-new"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="reset-confirm">Confirm new password</label>
            <input
              id="reset-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Set new password'}
          </button>
          <button type="button" className="link-button" onClick={onDone}>
            Back to log in
          </button>
        </form>
      )}
    </div>
  );
}

export default ResetPasswordPage;
