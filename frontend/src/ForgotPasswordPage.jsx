import { useState } from 'react';
import { requestPasswordReset } from './api';
import AuthLogo from './AuthLogo';

function ForgotPasswordPage({ onBack }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const data = await requestPasswordReset(email);
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <button type="button" className="link-button back-link" onClick={onBack}>
        &larr; Back to log in
      </button>
      <AuthLogo />
      <h1>Forgot your password?</h1>
      <form onSubmit={handleSubmit} className="login-form">
        <p className="register-note">
          Enter the contact email on your account and we will send you a link to choose a new password.
        </p>
        <div className="field">
          <label htmlFor="forgot-email">Contact email</label>
          <input
            id="forgot-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {error && <p className="error">{error}</p>}
        {message && <p className="form-success">{message}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>
    </div>
  );
}

export default ForgotPasswordPage;
