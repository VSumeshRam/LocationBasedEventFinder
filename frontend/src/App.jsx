import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './Home.jsx';
import Login from './Login.jsx';
import Register from './Register.jsx';
import AdminPanel from './AdminPanel.jsx';
import PostEvent from './PostEvent.jsx';
import EditEvent from './EditEvent.jsx'; // <-- Added EditEvent Import
import Profile from './Profile.jsx';
import InterestedEvents from './InterestedEvents.jsx';
import Notifications from './Notifications.jsx'; // <-- Added Notifications Import
import ApprovedOrgs from './ApprovedOrgs.jsx'; // <-- Added ApprovedOrgs Import

function App() {
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  const logout = () => {
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <BrowserRouter>
      <div className="app-container">
        <nav className="navbar glass-panel">
          <Link to="/" className="nav-brand">
            🌍 <span>EVENT SPHERE</span>
          </Link>

          <div className="nav-links">
            <Link to="/" className="nav-link">Live Map</Link>

            {/* Admin Module */}
            {user?.role === 'Admin' && (
              <>
                <Link to="/admin-panel" className="nav-link" style={{color: 'var(--status-danger)'}}>🛡️ Admin Panel</Link>
                <Link to="/approved-orgs" className="nav-link" style={{color: 'var(--status-warning)'}}>🏢 Approved Orgs</Link>
              </>
            )}

            {/* Organizer Module */}
            {user?.role === 'Organizer' && user?.isApproved && (
              <Link to="/post-event" className="nav-link" style={{color: 'var(--status-success)'}}>➕ Post Event</Link>
            )}

            {/* Authentication & Profile Links */}
            {!user ? (
              <>
                <Link to="/login" className="nav-link">Login</Link>
                <Link to="/register" className="btn-primary">Sign Up</Link>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Hi, <strong style={{color: 'var(--text-primary)'}}>{user.name}</strong></span>

                <Link to="/profile" className="nav-link">My Account</Link>
                <Link to="/interested-events" className="nav-link">⭐ Saved</Link>
                <Link to="/notifications" className="nav-link">🔔 Alerts</Link>

                <button onClick={logout} className="btn-outline">Logout</button>
              </div>
            )}
          </div>
        </nav>

        <div className="page-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin-panel" element={<AdminPanel />} />
            <Route path="/approved-orgs" element={<ApprovedOrgs />} />
            <Route path="/post-event" element={<PostEvent />} />
            <Route path="/edit-event/:id" element={<EditEvent />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/interested-events" element={<InterestedEvents />} />
            <Route path="/notifications" element={<Notifications />} />
          </Routes>
        </div>

      </div>
    </BrowserRouter>
  );
}

export default App;