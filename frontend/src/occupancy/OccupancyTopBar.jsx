import BrandMark from '../BrandMark';

function PayLink() {
  return (
    <a className="top-bar-link pay-link" href="https://www.paymypark.com/" target="_blank" rel="noopener noreferrer">
      Pay for parking
    </a>
  );
}

function LinkButton({ onClick, className = '', children }) {
  return (
    <button type="button" className={`top-bar-link ${className}`.trim()} onClick={onClick}>
      {children}
    </button>
  );
}

// Links for someone who is signed in: a driver or an admin.
function SignedInActions({ username, role, onAdminClick, onMyVehicleClick, onPredictionsClick, onLogout }) {
  return (
    <span className="top-bar-actions">
      <span className="user-status">Logged in as {username}</span>
      <PayLink />
      {role === 'admin' ? (
        <LinkButton onClick={onAdminClick}>Admin</LinkButton>
      ) : (
        <LinkButton onClick={onMyVehicleClick}>My vehicle</LinkButton>
      )}
      <LinkButton onClick={onPredictionsClick}>Predictions</LinkButton>
      <LinkButton onClick={onLogout}>Log out</LinkButton>
    </span>
  );
}

function VisitorActions({ onLoginClick, onAdminLoginClick, onPredictionsClick }) {
  return (
    <span className="top-bar-actions">
      <PayLink />
      <LinkButton onClick={onLoginClick}>Log in</LinkButton>
      <LinkButton onClick={onPredictionsClick}>Predictions</LinkButton>
      <LinkButton onClick={onAdminLoginClick} className="admin-login-link">
        Admin login
      </LinkButton>
    </span>
  );
}

function OccupancyTopBar(props) {
  return (
    <header className="top-bar">
      <div className="top-bar-inner">
        <BrandMark />
        {props.username ? <SignedInActions {...props} /> : <VisitorActions {...props} />}
      </div>
    </header>
  );
}

export default OccupancyTopBar;
