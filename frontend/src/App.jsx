import { useState } from 'react';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import OccupancyPage from './OccupancyPage';
import AdminPage from './AdminPage';
import PredictionsPage from './PredictionsPage';
import InquiriesPage from './InquiriesPage';
import MyVehiclePage from './MyVehiclePage';
import AccountPage from './AccountPage';
import ForgotPasswordPage from './ForgotPasswordPage';
import ResetPasswordPage from './ResetPasswordPage';
import './App.css';

// The emailed reset link opens the site as /?reset=<token>.
function readResetToken() {
  return new URLSearchParams(window.location.search).get('reset') || '';
}

function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [loggedInRole, setLoggedInRole] = useState(null);
  const [resetToken] = useState(readResetToken);
  const [view, setView] = useState(resetToken ? 'resetPassword' : 'occupancy');
  const [registeredUsername, setRegisteredUsername] = useState('');
  const [predictionsBack, setPredictionsBack] = useState('occupancy');

  if (view === 'resetPassword') {
    return (
      <ResetPasswordPage
        token={resetToken}
        onDone={() => {
          window.history.replaceState(null, '', window.location.pathname);
          setView('login');
        }}
      />
    );
  }

  if (view === 'forgotPassword') {
    return <ForgotPasswordPage onBack={() => setView('login')} />;
  }

  if (view === 'login' || view === 'adminLogin') {
    return (
      <LoginPage
        isAdmin={view === 'adminLogin'}
        onLoginSuccess={(username, role) => {
          setLoggedInUser(username);
          setLoggedInRole(role);
          setView('occupancy');
        }}
        onSwitchToRegister={() => setView('register')}
        onForgotPassword={() => setView('forgotPassword')}
        registeredUsername={registeredUsername}
        onBack={() => setView('occupancy')}
      />
    );
  }

  if (view === 'register') {
    return (
      <RegisterPage
        onRegisterSuccess={(username) => {
          setRegisteredUsername(username);
          setView('login');
        }}
        onSwitchToLogin={() => setView('login')}
        onBack={() => setView('occupancy')}
      />
    );
  }

  if (view === 'admin') {
    return (
      <AdminPage
        onBack={() => setView('occupancy')}
        onPredictionsClick={() => {
          setPredictionsBack('admin');
          setView('predictions');
        }}
        onInquiriesClick={() => setView('inquiries')}
      />
    );
  }

  if (view === 'predictions') {
    return <PredictionsPage onBack={() => setView(predictionsBack)} backLabel={predictionsBack === 'admin' ? 'Back to admin' : 'Back to occupancy'} />;
  }

  if (view === 'myVehicle') {
    return <MyVehiclePage onBack={() => setView('occupancy')} onAccountClick={() => setView('account')} />;
  }

  if (view === 'account') {
    return <AccountPage onBack={() => setView('myVehicle')} />;
  }

  if (view === 'inquiries') {
    return <InquiriesPage onBack={() => setView('admin')} />;
  }

  return (
    <OccupancyPage
      username={loggedInUser}
      role={loggedInRole}
      onLoginClick={() => setView('login')}
      onAdminLoginClick={() => setView('adminLogin')}
      onAdminClick={() => setView('admin')}
      onMyVehicleClick={() => setView('myVehicle')}
      onPredictionsClick={() => {
        setPredictionsBack('occupancy');
        setView('predictions');
      }}
      onLogout={() => {
        localStorage.removeItem('token');
        setLoggedInUser(null);
        setLoggedInRole(null);
      }}
    />
  );
}

export default App;
