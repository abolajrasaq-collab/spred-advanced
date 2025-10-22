import React, { useState, useEffect } from 'react';
import './App.css';
import SimpleDashboard from './components/SimpleDashboard';
import Login from './components/Login';
import { spredApi } from './services/spredApi';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const token = spredApi.getAuthToken();
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = (token: string) => {
    spredApi.setAuthToken(token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    spredApi.logout();
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="App">
        <div className="loading-screen">
          <h2>Loading SPRED Admin...</h2>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {isAuthenticated ? (
        <div className="admin-layout">
          <header className="admin-header">
            <div className="header-content">
              <h1>SPRED Admin Panel</h1>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          </header>
          <main className="admin-main">
            <SimpleDashboard onLogout={handleLogout} />
          </main>
        </div>
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
