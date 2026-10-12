import { useEffect, useState } from 'react';
import { getProfile, updateProfile, changePassword } from './api';
import BrandMark from './BrandMark';

function AccountPage({ onBack }) {
  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState('');

  const [plateNumber, setPlateNumber] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profileMessage, setProfileMessage] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [savingPassword, setSavingPassword] = useState(false);

  function fillForm(data) {
    setProfile(data);
    setPlateNumber(data.plateNumber || '');
    setContactEmail(data.contactEmail || '');
    setPhoneNumber(data.phoneNumber || '');
  }

  useEffect(() => {
    getProfile()
      .then(fillForm)
      .catch((err) => setLoadError(err.message));
  }, []);

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setProfileMessage(null);
    setSavingProfile(true);
    try {
      fillForm(await updateProfile({ plateNumber, contactEmail, phoneNumber }));
      setProfileMessage({ type: 'success', text: 'Your details have been saved.' });
    } catch (err) {
      setProfileMessage({ type: 'error', text: err.message });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordMessage(null);
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'The new passwords do not match.' });
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage({ type: 'success', text: 'Your password has been changed.' });
    } catch (err) {
      setPasswordMessage({ type: 'error', text: err.message });
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="occupancy-page">
      <header className="top-bar">
        <div className="top-bar-inner">
          <BrandMark />
          <button type="button" className="top-bar-link" onClick={onBack}>
            Back to my vehicle
          </button>
        </div>
      </header>

      <main className="page-content admin-content">
        <h1>Account settings</h1>
        {loadError && <p className="error">{loadError}</p>}

        {profile && (
          <>
            <p className="subtitle">
              Signed in as <strong>{profile.username}</strong>
            </p>
            <div className="account-grid">
              <form className="account-card" onSubmit={handleProfileSubmit}>
                <h2>Vehicle and contact</h2>
                <p className="account-hint">
                  Parking staff use these details to notify you if your vehicle is flagged.
                </p>
                <div className="field">
                  <label htmlFor="acc-plate">Vehicle plate number</label>
                  <input
                    id="acc-plate"
                    type="text"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    maxLength={8}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="acc-email">Contact email</label>
                  <input
                    id="acc-email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="acc-phone">Contact phone number</label>
                  <input
                    id="acc-phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                </div>
                {profileMessage && <p className={profileMessage.type}>{profileMessage.text}</p>}
                <button type="submit" disabled={savingProfile}>
                  {savingProfile ? 'Saving...' : 'Save changes'}
                </button>
              </form>

              <form className="account-card" onSubmit={handlePasswordSubmit}>
                <h2>Change password</h2>
                <p className="account-hint">Use at least 6 characters.</p>
                <div className="field">
                  <label htmlFor="acc-current">Current password</label>
                  <input
                    id="acc-current"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="acc-new">New password</label>
                  <input
                    id="acc-new"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="acc-confirm">Confirm new password</label>
                  <input
                    id="acc-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                {passwordMessage && <p className={passwordMessage.type}>{passwordMessage.text}</p>}
                <button type="submit" disabled={savingPassword}>
                  {savingPassword ? 'Updating...' : 'Update password'}
                </button>
              </form>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default AccountPage;
