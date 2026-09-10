import { useState } from 'react';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import OccupancyPage from './OccupancyPage';
import './App.css';

function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [view, setView] = useState('occupancy');
  const [registeredUsername, setRegisteredUsername] = useState('');

  if (view === 'login') {
    return (
      <LoginPage
        onLoginSuccess={(username) => {
          setLoggedInUser(username);
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

  return (
    <OccupancyPage
      username={loggedInUser}
      onLoginClick={() => setView('login')}
    />
  );
}

export default App;
