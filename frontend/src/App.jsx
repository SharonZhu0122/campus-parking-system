import { useState } from 'react';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import OccupancyPage from './OccupancyPage';
import './App.css';

function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [view, setView] = useState('login');
  const [registeredUsername, setRegisteredUsername] = useState('');

  if (loggedInUser) {
    return <OccupancyPage username={loggedInUser} />;
  }

  if (view === 'register') {
    return (
      <RegisterPage
        onRegisterSuccess={(username) => {
          setRegisteredUsername(username);
          setView('login');
        }}
        onSwitchToLogin={() => setView('login')}
      />
    );
  }

  return (
    <LoginPage
      onLoginSuccess={setLoggedInUser}
      onSwitchToRegister={() => setView('register')}
      registeredUsername={registeredUsername}
    />
  );
}

export default App;
