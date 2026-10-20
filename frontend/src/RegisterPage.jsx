import { useState } from 'react';
import { register } from './api';
import AuthLogo from './AuthLogo';
import FormField from './components/FormField';

const EMPTY_FORM = { username: '', password: '', plateNumber: '', contactEmail: '', phoneNumber: '' };

// The fields, in order, with how each one is shown.
const FIELDS = [
  { name: 'username', id: 'reg-username', label: 'Username', type: 'text' },
  { name: 'password', id: 'reg-password', label: 'Password', type: 'password', minLength: 6, placeholder: 'At least 6 characters' },
  { name: 'plateNumber', id: 'reg-plate', label: 'Vehicle plate number', type: 'text', maxLength: 8, placeholder: 'e.g. ABC123' },
  { name: 'contactEmail', id: 'reg-email', label: 'Contact email', type: 'email', placeholder: 'For violation notifications' },
  { name: 'phoneNumber', id: 'reg-phone', label: 'Contact phone number', type: 'tel', placeholder: 'e.g. 021 123 4567' },
];

function RegisterPage({ onRegisterSuccess, onSwitchToLogin, onBack }) {
  const [values, setValues] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(values.username, values.password, values.plateNumber, values.contactEmail, values.phoneNumber);
      onRegisterSuccess(values.username);
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
      <AuthLogo />
      <h1>Campus Parking System</h1>
      <form onSubmit={handleSubmit} className="login-form">
        <p className="register-note">
          Register your vehicle to check whether it has any violations, and so parking staff can contact you if it
          does. You don&apos;t need an account to see car park availability.
        </p>
        {FIELDS.map(({ name, label, ...inputProps }) => (
          <FormField
            key={name}
            label={label}
            value={values[name]}
            onChange={(e) => setValues({ ...values, [name]: e.target.value })}
            required
            {...inputProps}
          />
        ))}
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
        <p className="switch-link">
          Already have an account?{' '}
          <button type="button" className="link-button" onClick={onSwitchToLogin}>
            Log in
          </button>
        </p>
      </form>
    </div>
  );
}

export default RegisterPage;
