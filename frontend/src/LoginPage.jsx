import { useState } from 'react';
import { login } from './api';

function LoginPage({ onLoginSuccess, onSwitchToRegister, registeredUsername, onBack }) {
  const [username, setUsername] = useState(registeredUsername || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(username, password);
      localStorage.setItem('token', data.token);
      onLoginSuccess(username);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <button type="button" className="link-button back-link" onClick={onBack}>
        &larr; Back to gate occupancy
      </button>
      <h1>Campus Parking System</h1>
      <form onSubmit={handleSubmit} className="login-form">
        <div className="field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Log in'}
        </button>
        <p className="switch-link">
          Don&apos;t have an account?{' '}
          <button type="button" className="link-button" onClick={onSwitchToRegister}>
            Register
          </button>
        </p>
      </form>
    </div>
  );
}

export default LoginPage;
