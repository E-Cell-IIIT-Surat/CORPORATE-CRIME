import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import PlayerLogin from './pages/PlayerLogin';
import PlayerSignup from './pages/PlayerSignup';
import PlayerDashboard from './pages/PlayerDashboard';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

const PrivateRoute = ({ children, role }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  if (!token || userRole !== role) {
    return <Navigate to={role === 'admin' ? '/admin/login' : '/login'} />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#0c1222',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.1)',
        },
      }} />
      <div className="min-h-screen bg-gray-950">
        <Routes>
          {/* Player Routes */}
          <Route path="/login" element={<PlayerLogin />} />
          <Route path="/signup" element={<PlayerSignup />} />
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute role="player">
                <PlayerDashboard />
              </PrivateRoute>
            } 
          />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route 
            path="/admin/dashboard" 
            element={
              <PrivateRoute role="admin">
                <AdminDashboard />
              </PrivateRoute>
            } 
          />

          {/* Default Redirects */}
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/admin" element={<Navigate to="/admin/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
