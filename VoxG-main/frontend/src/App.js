import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard';
import ManageKeywords from './pages/ManageKeywords';
import PrivacyControls from './pages/PrivacyControls';
import AccuracyCheck from './pages/AccuracyCheck';
import Login from './pages/Login';
import './App.css';

function AppContent() {
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);

  if (!user) {
    return (
      <div className={`app-container ${darkMode ? 'dark-app' : ''}`}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    );
  }

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  return (
    <div className={`app-wrapper ${darkMode ? 'dark-mode' : ''}`}>
      {/* 🔥 SINGLE NAV WITH LOGOUT TOP-LEFT + ONE TOGGLE */}
      <nav className="app-nav">
        {/* 🔥 LOGOUT TOP-LEFT */}
        <div className="nav-left">
          <button className="logout-nav-btn" onClick={logout}>
            🚪 Logout
          </button>
          <div className="nav-brand">
            <span>🛡️ VoxGuard</span>
          </div>
        </div>

        {/* 🔥 CENTER LINKS */}
        <div className="nav-center">
          <Link to="/">📊 Dashboard</Link>
          <Link to="/manage-keywords">🔑 Keywords</Link>
          <Link to="/privacy-controls">🔐 Privacy</Link>
          <Link to="/accuracy-check">📈 Accuracy</Link>
        </div>

        {/* 🔥 SINGLE DARKMODE TOGGLE TOP-RIGHT */}
        <div className="nav-right">
          <button 
            className="dark-toggle"
            onClick={toggleDarkMode}
            title={darkMode ? "Light Mode" : "Dark Mode"}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>

      {/* 🔥 MAIN CONTENT */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard darkMode={darkMode} toggleDarkMode={toggleDarkMode} />} />
          <Route path="/manage-keywords" element={<ManageKeywords darkMode={darkMode} toggleDarkMode={toggleDarkMode} />} />
          <Route path="/privacy-controls" element={<PrivacyControls darkMode={darkMode} toggleDarkMode={toggleDarkMode} />} />
          <Route path="/accuracy-check" element={<AccuracyCheck darkMode={darkMode} toggleDarkMode={toggleDarkMode} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;