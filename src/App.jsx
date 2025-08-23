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

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app load
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
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
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route 
            path="/" 
            element={user ? <Navigate to={`/${user.role}`} /> : <Home />} 
          />
          <Route 
            path="/login" 
            element={user ? <Navigate to={`/${user.role}`} /> : <Login onLogin={handleLogin} />} 
          />
          <Route 
            path="/billcollector" 
            element={user?.role === 'billcollector' ? 
              <BillCollectorDashboard user={user} onLogout={handleLogout} /> : 
              <Navigate to="/login" />} 
          />
          <Route 
            path="/teamleader" 
            element={user?.role === 'teamleader' ? 
              <TeamLeaderDashboard user={user} onLogout={handleLogout} /> : 
              <Navigate to="/login" />} 
          />
          <Route 
            path="/member" 
            element={user?.role === 'member' ? 
              <IndividualMemberDashboard user={user} onLogout={handleLogout} /> : 
              <Navigate to="/login" />} 
          />
          <Route 
            path="/admin" 
            element={user?.role === 'admin' ? 
              <AdminDashboard user={user} onLogout={handleLogout} /> : 
              <Navigate to="/login" />} 
          />
          <Route 
            path="/adminclerk" 
            element={user?.role === 'adminclerk' ? 
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