// App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Home from './components/Home';
import Login from './components/Login';
import BillCollectorDashboard from './components/BillCollectorDashboard';
import TeamLeaderDashboard from './components/TeamLeaderDashboard';
import IndividualMemberDashboard from './components/IndividualMemberDashboard';
import AdminDashboard from './components/AdminDashboard';
import AdminClerkDashboard from './components/AdminClerkDashboard';
import apiService from './services/api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app load
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    
    
    if (savedUser && savedToken) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        // Make sure the API service has the token
        apiService.setToken(savedToken);
      } catch (error) {
        // Clear corrupted data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    } else {
      // Clear any stale data
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Helper function to get the correct route based on user role
  const getRouteForRole = (role) => {
    const route = (() => {
      switch (role?.toLowerCase()) {
        case 'admin':
          return '/admin';
        case 'adminclerk':
        case 'clerk':
          return '/adminclerk';
        case 'teamleader':
        case 'team_leader':
          return '/teamleader';
        case 'billcollector':
        case 'collector':
          return '/billcollector';
        case 'member':
        case 'individual_member':
          return '/member';
        default:
          return '/login'; // Default to login if role is unknown
      }
    })();
    return route;
  };

  return (
        <Router>
        <div className="min-h-screen bg-gray-100">
          <Routes>
          <Route 
            path="/" 
            element={<Home />} 
          />
          <Route 
            path="/login" 
            element={<Login onLogin={handleLogin} />} 
          />
          <Route 
            path="/billcollector" 
            element={user?.role && ['billcollector', 'collector'].includes(user.role.toLowerCase()) ? 
              <BillCollectorDashboard user={user} onLogout={handleLogout} /> : 
              <Navigate to="/login" />} 
          />
          <Route 
            path="/teamleader" 
            element={user?.role && ['teamleader', 'team_leader'].includes(user.role.toLowerCase()) ? 
              <TeamLeaderDashboard user={user} onLogout={handleLogout} /> : 
              <Navigate to="/login" />} 
          />
          <Route 
            path="/member" 
            element={user?.role && ['member', 'individual_member'].includes(user.role.toLowerCase()) ? 
              <IndividualMemberDashboard user={user} onLogout={handleLogout} /> : 
              <Navigate to="/login" />} 
          />
          <Route 
            path="/admin" 
            element={user?.role && ['admin'].includes(user.role.toLowerCase()) ? 
              <AdminDashboard user={user} onLogout={handleLogout} /> : 
              <Navigate to="/login" />} 
          />
          <Route 
            path="/adminclerk" 
            element={user?.role && ['adminclerk', 'clerk'].includes(user.role.toLowerCase()) ? 
              <AdminClerkDashboard user={user} onLogout={handleLogout} /> : 
              <Navigate to="/login" />} 
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;