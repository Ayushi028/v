import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import '../App.css';

function Dashboard({ darkMode = false, toggleDarkMode = () => {} }) {
  const navigate = useNavigate();
  
  // State
  const [stats, setStats] = useState({ callsDetected: 0, spamBlocked: 0 });
  const [totalHistory, setTotalHistory] = useState({ callsDetected: 0, spamBlocked: 0 });
  const [sessionTime, setSessionTime] = useState(0);
  const [sensitivity, setSensitivity] = useState(50);
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState('connecting...');
  const [lastCallResult, setLastCallResult] = useState(null);

  // Load stats from backend
  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const logsRes = await api.logs.getAll();
      const logs = logsRes.data?.data || logsRes.data || [];
      
      if (logs.length === 0) {
        setStats({ callsDetected: 0, spamBlocked: 0 });
        setBackendStatus('🚀 Fresh Deploy - Ready!');
        setLoading(false);
        return;
      }
      
      const totalCalls = logs.length;
      const spamCalls = logs.filter(log => 
        log.analysis?.status === 'ALERT' || log.analysis?.detectedKeywords?.length > 0
      ).length;
      
      setStats({
        callsDetected: totalCalls,
        spamBlocked: spamCalls
      });
      setBackendStatus(`✅ LIVE (${totalCalls} calls)`);
      
    } catch (error) {
      console.error('Stats load error:', error);
      setBackendStatus('🔄 Demo Ready');
    } finally {
      setLoading(false);
    }
  }, []);

  // Simulate test call
  const addCall = useCallback(async () => {
    const callerId = `+1-555-${Math.floor(Math.random() * 9000) + 1000}`;
    const isScam = Math.random() < 0.3;
    
    const transcripts = {
      scam: ["FREE MONEY! WON $1M lottery PRIZE! IRS LOAN!", "WIN lottery! FREE MONEY PRIZE!", "IRS FREE MONEY lottery!"],
      safe: ["Pizza delivery order ready", "Bank transaction confirmation", "Doctor appointment reminder"]
    };
    
    const transcript = (isScam ? transcripts.scam : transcripts.safe)[
      Math.floor(Math.random() * transcripts[isScam ? 'scam' : 'safe'].length)
    ];

    console.log(`📞 ${callerId} | ${isScam ? '🚨 SCAM' : '✅ SAFE'}`);
    console.log(`💬 "${transcript}"`);

    // Update local history FIRST (optimistic update)
    setTotalHistory(prev => ({
      callsDetected: prev.callsDetected + 1,
      spamBlocked: prev.spamBlocked + (isScam ? 1 : 0)
    }));

    try {
      const response = await api.logs.report({
        callerId: callerId.trim(),
        duration: (30 + Math.random() * 120).toFixed(1),
        transcript
      });

      const analysis = response.data?.analysis || response.data || {};
      const status = analysis.status || 'SAFE';
      const keywords = analysis.detectedKeywords || [];
      const confidence = analysis.confidence || 50;
      const isSpam = status === 'ALERT';

      console.log(`${isSpam ? '🚫SPAM DETECTED' : '✅SAFE'} | ${confidence}%`);

      setLastCallResult({
        type: isSpam ? 'spam' : 'safe',
        message: isSpam ? `| 🎯 ${keywords.join(', ')} |` : 'NONE',
        confidence,
        keywords,
        time: new Date().toLocaleTimeString(),
        matchedCount: keywords.length
      });

    } catch (error) {
      console.error('💥 API Error:', error.response?.data || error.message);
      
      // Demo fallback - FORCE keywords for spam demo
      const demoKeywords = isScam 
        ? ['free money', 'lottery', 'prize', 'IRS', 'loan'] 
        : [];
      const demoConfidence = isScam ? 83 : 20;
      
      console.log(`🔄 DEMO | 🎯 ${demoKeywords.join(', ') || 'NONE'} | ${demoConfidence}%`);

      setLastCallResult({
        type: isScam ? 'spam' : 'safe',
        message: isScam ? `| 🎯 ${demoKeywords.join(', ')} |` : 'NONE',
        confidence: demoConfidence,
        keywords: demoKeywords,
        time: new Date().toLocaleTimeString(),
        matchedCount: demoKeywords.length,
        demo: true
      });
    }

    // Refresh stats from backend
    loadStats();
  }, [loadStats]);

  // Format session time
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Slider handler
  const handleSliderChange = (e) => {
    setSensitivity(Number(e.target.value));
  };

  // Effects
  useEffect(() => {
    loadStats();
    
    // Session timer
    const sessionTimer = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);
    
    // Stats refresh every 30s
    const statsInterval = setInterval(loadStats, 30000);
    
    return () => {
      clearInterval(sessionTimer);
      clearInterval(statsInterval);
    };
  }, [loadStats]);

  // Loading state
  if (loading) {
    return (
      <div className={`dashboard-loading ${darkMode ? 'dark-loading' : ''}`}>
        <div>🔄 Loading Dashboard...</div>
        <div>🚀 Preparing spam protection...</div>
      </div>
    );
  }

  return (
    <div className={`dashboard-container ${darkMode ? 'dark-container' : ''}`}>
      {/* Header */}
      <header className={`header ${darkMode ? 'dark-header' : ''}`}>
        <div className="header-top">
          <div className="header-logo">
            <img src="/VoxGuard_logo.png" alt="VoxGuard Logo" className="logo-img" />
          </div>
        </div>
        <div className="status-badge">
          <div className="status-indicator">
            <span className="status-dot"></span>
            <span className="status-text">Protection Active</span>
          </div>
          <p className="status-subtitle">{backendStatus}</p>
        </div>
      </header>

      {/* Metrics */}
      <section className="metrics-section">
        <div className={`metric-card ${darkMode ? 'dark-card' : ''}`} onClick={addCall} style={{cursor: 'pointer'}}>
          <div className="metric-icon">📞</div>
          <p className="metric-label">Calls Detected</p>
          <p className="metric-value">{stats.callsDetected}</p>
          <div className="metric-hint">
            {lastCallResult ? (
              <div className={`last-result ${lastCallResult.type} ${darkMode ? 'dark-result' : ''}`}>
                <span className="result-icon">
                  {lastCallResult.type === 'spam' ? '🚨' : '✅'}
                </span>
                <span className="result-text">
                  {lastCallResult.demo && '(Demo) '}
                  {lastCallResult.message}
                  <small>{Math.round(lastCallResult.confidence)}%</small>
                </span>
                {lastCallResult.matchedCount > 0 && lastCallResult.type === 'spam' && (
                  <small className="result-count">({lastCallResult.matchedCount})</small>
                )}
              </div>
            ) : (
              <span>👆 Tap for test call!</span>
            )}
          </div>
        </div>
        
        <div className={`metric-card ${darkMode ? 'dark-card' : ''}`}>
          <div className="metric-icon">🚫</div>
          <p className="metric-label">Spam Blocked</p>
          <p className="metric-value">{stats.spamBlocked}</p>
          <p className="metric-hint">{backendStatus.includes('LIVE') ? 'Live' : 'Demo'}</p>
        </div>
        
        <div className={`metric-card ${darkMode ? 'dark-card' : ''}`}>
          <div className="metric-icon">⏰</div>
          <p className="metric-label">Session</p>
          <p className="metric-value">{formatTime(sessionTime)}</p>
          <p className="metric-hint">Active</p>
        </div>
      </section>

      {/* Sensitivity Slider */}
      <section className={`slider-section ${darkMode ? 'dark-section' : ''}`}>
        <div className="slider-label">
          <h3>🎛️ Detection Sensitivity</h3>
          <span className="slider-value">{sensitivity}%</span>
        </div>
        <input
          type="range" 
          min="0" 
          max="100" 
          value={sensitivity}
          onChange={handleSliderChange}
          className="sensitivity-slider"
        />
        <div className="slider-labels">
          <span>🔓 Allow More</span>
          <span>🔒 Block More</span>
        </div>
        <div className="sensitivity-info">
          <p>
            {sensitivity < 30 && "🔒 Low"} 
            {sensitivity >= 30 && sensitivity < 70 && "⚖️ Medium"} 
            {sensitivity >= 70 && "🔥 High"}
          </p>
        </div>
      </section>

      {/* Action Buttons */}
      <section className="buttons-section">
        <button className={`action-button ${darkMode ? 'dark-button' : ''}`} onClick={() => navigate('/manage-keywords')}>
          <span className="button-icon">📝</span>
          <div className="button-text">
            <span>Manage Keywords</span>
            <span>Add spam triggers</span>
          </div>
        </button>
        <button className={`action-button ${darkMode ? 'dark-button' : ''}`} onClick={() => navigate('/privacy-controls')}>
          <span className="button-icon">🔐</span>
          <div className="button-text">
            <span>Privacy Controls</span>
            <span>Manage data</span>
          </div>
        </button>
        <button className={`action-button ${darkMode ? 'dark-button' : ''}`} onClick={() => navigate('/accuracy-check')}>
          <span className="button-icon">📊</span>
          <div className="button-text">
            <span>Accuracy Check</span>
            <span>View stats</span>
          </div>
        </button>
      </section>

      {/* Debug Console */}
      <section className={`console-instructions ${darkMode ? 'dark-section' : ''}`}>
        <h4>🔧 Debug Console:</h4>
        <p>F12 → Console → See <strong>"SPAM DETECTED" vs "SAFE"</strong> + keywords!</p>
      </section>

      {/* Privacy Section */}
      <section className={`privacy-section ${darkMode ? 'dark-privacy' : ''}`}>
        <h3>🔐 Privacy First</h3>
        <p>End-to-end encryption. Instant data purge. Never shared.</p>
      </section>
    </div>
  );
}

export default Dashboard;