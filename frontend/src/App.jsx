import { useState } from 'react';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import OccupancyPage from './OccupancyPage';
import AdminPage from './AdminPage';
import PredictionsPage from './PredictionsPage';
import './App.css';

function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [loggedInRole, setLoggedInRole] = useState(null);
  const [view, setView] = useState('occupancy');
  const [registeredUsername, setRegisteredUsername] = useState('');

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
        onPredictionsClick={() => setView('predictions')}
      />
    );
  }

  if (view === 'predictions') {
    return <PredictionsPage onBack={() => setView('admin')} />;
  }

  return (
    <OccupancyPage
      username={loggedInUser}
      role={loggedInRole}
      onLoginClick={() => setView('login')}
      onAdminLoginClick={() => setView('adminLogin')}
      onAdminClick={() => setView('admin')}
      onLogout={() => {
        localStorage.removeItem('token');
        setLoggedInUser(null);
        setLoggedInRole(null);
      }}
    />
  );
}

export default App;
