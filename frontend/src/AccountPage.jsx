import { useEffect, useState } from 'react';
import { getProfile } from './api';
import BrandMark from './BrandMark';
import PasswordForm from './account/PasswordForm';
import ProfileForm from './account/ProfileForm';

function AccountPage({ onBack }) {
  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch((err) => setLoadError(err.message));
  }, []);

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
              <ProfileForm profile={profile} onSaved={setProfile} />
              <PasswordForm />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default AccountPage;
