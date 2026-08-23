import { useState } from 'react';
import LoginPage from './LoginPage';
import './App.css';

function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);

  if (!loggedInUser) {
    return <LoginPage onLoginSuccess={setLoggedInUser} />;
  }

  return (
    <div className="welcome-page">
      <h1>Welcome, {loggedInUser}</h1>
      <p>Gate occupancy page coming next.</p>
    </div>
  );
}

export default App;
