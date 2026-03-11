import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './Home.jsx';
import Login from './Login.jsx';
import Register from './Register.jsx';
import AdminPanel from './AdminPanel.jsx';
import PostEvent from './PostEvent.jsx';
import Profile from './Profile.jsx';
import InterestedEvents from './InterestedEvents.jsx';
import Notifications from './Notifications.jsx'; // <-- Added Notifications Import

function App() {
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  const logout = () => {
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <BrowserRouter>
      <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f4f4f9', minHeight: '100vh' }}>

        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 25px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#007BFF' }}>🌍 EVENT SPHERE</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Link to="/" style={{ textDecoration: 'none', color: '#555', fontWeight: 'bold' }}>Live Map</Link>

            {/* Admin Module */}
            {user?.role === 'Admin' && (
              <Link to="/admin-panel" style={{ textDecoration: 'none', color: '#dc3545', fontWeight: 'bold' }}>🛡️ Admin Panel</Link>
            )}

            {/* Organizer Module */}
            {user?.role === 'Organizer' && user?.isApproved && (
              <Link to="/post-event" style={{ textDecoration: 'none', color: '#28a745', fontWeight: 'bold' }}>➕ Post Event</Link>
            )}

            {/* Authentication & Profile Links */}
            {!user ? (
              <>
                <Link to="/login" style={{ textDecoration: 'none', color: '#555', fontWeight: 'bold' }}>Login</Link>
                <Link to="/register" style={{ textDecoration: 'none', color: 'white', backgroundColor: '#007BFF', padding: '8px 15px', borderRadius: '5px' }}>Sign Up</Link>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ fontSize: '14px', color: '#777' }}>Hi, {user.name}!</span>

                {/* <-- Added Profile Link Here --> */}
                <Link to="/profile" style={{ textDecoration: 'none', color: '#007BFF', fontWeight: 'bold' }}>My Account</Link>
                <Link to="/interested-events" style={{ textDecoration: 'none', color: '#28a745', fontWeight: 'bold' }}>⭐ Interested Events</Link>
                <Link to="/notifications" style={{ textDecoration: 'none', color: '#ff9800', fontWeight: 'bold' }}>🔔 Notifications</Link>

                <button onClick={logout} style={{ padding: '8px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Logout</button>
              </div>
            )}
          </div>
        </nav>

        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin-panel" element={<AdminPanel />} />
            <Route path="/post-event" element={<PostEvent />} />
            {/* <-- Added Profile Route Here --> */}
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