import { useState } from 'react';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import OccupancyPage from './OccupancyPage';
import AdminPage from './AdminPage';
import PredictionsPage from './PredictionsPage';
import InquiriesPage from './InquiriesPage';
import './App.css';

function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [loggedInRole, setLoggedInRole] = useState(null);
  const [view, setView] = useState('occupancy');
  const [registeredUsername, setRegisteredUsername] = useState('');
  const [predictionsBack, setPredictionsBack] = useState('occupancy');

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
