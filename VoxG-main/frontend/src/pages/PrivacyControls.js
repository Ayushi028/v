import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api'; // Backend connection
import '../App.css';

function PrivacyControls({ darkMode, toggleDarkMode }) {
  const navigate = useNavigate();
  
  // 🔥 REAL BACKEND LOGS + LOCAL SETTINGS
  const [settings, setSettings] = useState({
    dataCollection: true,
    callRecording: false,
    cloudBackup: false,
    locationTracking: false,
    anonymousAnalytics: true
  });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purging, setPurging] = useState(false);

  // 🔥 LOAD LOGS FROM BACKEND
  useEffect(() => {
    loadLogs();
    // Load settings from localStorage (persistent)
    const saved = localStorage.getItem('privacySettings');
    if (saved) setSettings(JSON.parse(saved));
  }, []);

  const loadLogs = async () => {
    try {
      const response = await api.logs.getAll();
      setLogs(response.data.data || []);
    } catch (error) {
      console.log('No logs access');
    } finally {
      setLoading(false);
    }
  };

  const toggleSetting = (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    localStorage.setItem('privacySettings', JSON.stringify(newSettings)); // 🔥 PERSISTENT
  };

  // 🔥 REAL LOG PURGE FROM BACKEND
  const purgeLogs = async () => {
    if (window.confirm(`Permanently delete ${logs.length} call logs?`)) {
      setPurging(true);
      try {
        await api.logs.purge();
        setLogs([]);
        alert(`✅ Privacy purge complete! ${logs.length} logs deleted.`);
      } catch (error) {
        alert('Purge failed - check login');
      } finally {
        setPurging(false);
      }
    }
  };

  return (
    <div className={`page-container ${darkMode ? 'dark-container' : ''}`}>
      <button 
        className={`back-button ${darkMode ? 'dark-back' : ''}`} 
        onClick={() => navigate('/')}
      >
        ← Back to Dashboard
      </button>

      <button 
        className={`dark-mode-toggle ${darkMode ? 'active' : ''}`}
        onClick={toggleDarkMode}
        title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {darkMode ? '☀️' : '🌙'}
      </button>
      
      <div className={`page-content ${darkMode ? 'dark-page-content' : ''}`}>
        <div className="page-header">
          <span className="page-icon">🔒</span>
          <h1>Privacy Controls</h1>
          <div className="log-count">📋 {logs.length} call logs stored</div>
        </div>
        
        <p className="page-description">
          Manage your data. <strong>Purge logs instantly</strong> from backend server.
        </p>

        {/* 🔥 PURGE BUTTON - REAL BACKEND DELETE */}
        <div className="purge-section">
          <button 
            className="purge-button"
            onClick={purgeLogs}
            disabled={purging || loading}
          >
            {purging ? '🗑️ Deleting...' : `🗑️ Clear All Logs (${logs.length})`}
          </button>
        </div>

        {/* Your existing settings - now PERSISTENT */}
        <div className="settings-list">
          <div className={`setting-item ${darkMode ? 'dark-setting-item' : ''}`}>
            <div className="setting-info">
              <span className="setting-icon">📊</span>
              <div>
                <h4>Data Collection</h4>
                <p>Allow anonymous usage data</p>
              </div>
            </div>
            <button 
              className={`toggle-button ${settings.dataCollection ? 'active' : ''}`}
              onClick={() => toggleSetting('dataCollection')}
            >
              {settings.dataCollection ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className={`setting-item ${darkMode ? 'dark-setting-item' : ''}`}>
            <div className="setting-info">
              <span className="setting-icon">🎙️</span>
              <div>
                <h4>Call Recording</h4>
                <p>Record calls for analysis</p>
              </div>
            </div>
            <button 
              className={`toggle-button ${settings.callRecording ? 'active' : ''}`}
              onClick={() => toggleSetting('callRecording')}
            >
              {settings.callRecording ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className={`setting-item ${darkMode ? 'dark-setting-item' : ''}`}>
            <div className="setting-info">
              <span className="setting-icon">☁️</span>
              <div>
                <h4>Cloud Backup</h4>
                <p>Backup settings to cloud</p>
              </div>
            </div>
            <button 
              className={`toggle-button ${settings.cloudBackup ? 'active' : ''}`}
              onClick={() => toggleSetting('cloudBackup')}
            >
              {settings.cloudBackup ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className={`setting-item ${darkMode ? 'dark-setting-item' : ''}`}>
            <div className="setting-info">
              <span className="setting-icon">📍</span>
              <div>
                <h4>Location Tracking</h4>
                <p>Regional spam patterns</p>
              </div>
            </div>
            <button 
              className={`toggle-button ${settings.locationTracking ? 'active' : ''}`}
              onClick={() => toggleSetting('locationTracking')}
            >
              {settings.locationTracking ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className={`setting-item ${darkMode ? 'dark-setting-item' : ''}`}>
            <div className="setting-info">
              <span className="setting-icon">📈</span>
              <div>
                <h4>Anonymous Analytics</h4>
                <p>Improve global detection</p>
              </div>
            </div>
            <button 
              className={`toggle-button ${settings.anonymousAnalytics ? 'active' : ''}`}
              onClick={() => toggleSetting('anonymousAnalytics')}
            >
              {settings.anonymousAnalytics ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* 🔥 RECENT LOGS PREVIEW */}
        {logs.length > 0 && (
          <div className="recent-logs">
            <h4>Recent Activity:</h4>
            {logs.slice(-3).map(log => (
              <div key={log.id} className={`log-preview ${log.analysis?.isSpam ? 'spam' : ''}`}>
                {log.callerId} {log.analysis?.isSpam ? '🚨' : '✅'}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PrivacyControls;