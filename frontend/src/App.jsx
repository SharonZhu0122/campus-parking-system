import { useState } from 'react';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import './App.css';

function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [view, setView] = useState('login');
  const [registeredUsername, setRegisteredUsername] = useState('');

  if (loggedInUser) {
    return (
      <div className="welcome-page">
        <h1>Welcome, {loggedInUser}</h1>
        <p>Gate occupancy page coming next.</p>
      </div>
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
