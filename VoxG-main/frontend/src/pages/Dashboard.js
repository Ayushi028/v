import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import '../App.css';

function Dashboard({ darkMode = false, toggleDarkMode = () => {} }) {
  const navigate = useNavigate();
  
  // Core state
  const [stats, setStats] = useState({ callsDetected: 0, spamBlocked: 0 });
  const [sessionTime, setSessionTime] = useState(0);
  const [sensitivity, setSensitivity] = useState(50);
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState('connecting...');
  const [lastCallResult, setLastCallResult] = useState(null);
  const [isTestingCall, setIsTestingCall] = useState(false);
  const [error, setError] = useState(null);

  // Constants
  const TEST_CALL_CONFIG = {
    callerPrefix: '+1-555-',
    minDuration: 30,
    maxDuration: 150,
    scamProbability: 0.3,
    transcripts: {
      scam: [
        "FREE MONEY! WON $1M lottery PRIZE! IRS LOAN!",
        "WIN lottery! FREE MONEY PRIZE!",
        "IRS FREE MONEY lottery! Click now!",
        "Your social security number suspended!"
      ],
      safe: [
        "Pizza delivery order ready for pickup",
        "Bank transaction confirmation received",
        "Doctor appointment reminder tomorrow",
        "Package delivery scheduled for today"
      ]
    }
  };

  // Derived state
  const spamBlockRate = useMemo(() => {
    if (stats.callsDetected === 0) return 0;
    return Math.round((stats.spamBlocked / stats.callsDetected) * 100);
  }, [stats.callsDetected, stats.spamBlocked]);

  const sensitivityLevel = useMemo(() => {
    if (sensitivity < 30) return 'low';
    if (sensitivity < 70) return 'medium';
    return 'high';
  }, [sensitivity]);

  // Load stats from backend
  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const logsRes = await api.logs.getAll();
      const logs = logsRes.data?.data || logsRes.data || [];
      
      if (logs.length === 0) {
        setStats({ callsDetected: 0, spamBlocked: 0 });
        setBackendStatus('🚀 Fresh Deploy - Ready!');
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
      setError('Failed to load stats. Using demo mode.');
      setBackendStatus('🔄 Demo Ready');
    } finally {
      setLoading(false);
    }
  }, []);

  // Process call analysis
  const processCallAnalysis = async (callerId, duration, transcript) => {
    try {
      const response = await api.logs.report({ 
        callerId: callerId.trim(), 
        duration, 
        transcript 
      });
      const analysis = response.data?.analysis || response.data || {};
      return createResultObject(analysis, false);
    } catch (error) {
      console.error('💥 API Error:', error.response?.data || error.message);
      return createDemoResult(transcript);
    }
  };

  const createResultObject = (analysis, isDemo = false) => {
    const status = analysis.status || 'SAFE';
    const keywords = analysis.detectedKeywords || [];
    const confidence = analysis.confidence || 50;
    const isSpam = status === 'ALERT';

    return {
      type: isSpam ? 'spam' : 'safe',
      message: isSpam ? `🎯 ${keywords.join(', ')}` : 'No threats detected',
      confidence,
      keywords,
      time: new Date().toLocaleTimeString(),
      matchedCount: keywords.length,
      demo: isDemo
    };
  };

  const createDemoResult = (transcript) => {
    const scamKeywords = ['free money', 'lottery', 'prize', 'IRS', 'loan', 'social security'];
    const demoKeywords = scamKeywords.filter(keyword => 
      transcript.toLowerCase().includes(keyword)
    );
    const demoConfidence = demoKeywords.length > 0 ? 83 + Math.floor(Math.random() * 17) : 20 + Math.floor(Math.random() * 15);
    const isScam = demoKeywords.length > 0;

    console.log(`🔄 DEMO MODE | ${isScam ? '🚨 SPAM' : '✅ SAFE'} | 🎯 ${demoKeywords.join(', ') || 'NONE'} | ${demoConfidence}%`);

    return createResultObject({ 
      status: isScam ? 'ALERT' : 'SAFE', 
      detectedKeywords: demoKeywords, 
      confidence: demoConfidence 
    }, true);
  };

  // Test call handler
  const addCall = useCallback(async () => {
    if (isTestingCall) return;
    
    setIsTestingCall(true);
    setLastCallResult(null);
    
    const callerId = `${TEST_CALL_CONFIG.callerPrefix}${Math.floor(Math.random() * 9000) + 1000}`;
    const isScam = Math.random() < TEST_CALL_CONFIG.scamProbability;
    const transcripts = TEST_CALL_CONFIG.transcripts[isScam ? 'scam' : 'safe'];
    const transcript = transcripts[Math.floor(Math.random() * transcripts.length)];
    const duration = (TEST_CALL_CONFIG.minDuration + 
      Math.random() * (TEST_CALL_CONFIG.maxDuration - TEST_CALL_CONFIG.minDuration)
    ).toFixed(1);

    console.log(`📞 ${callerId} | ${isScam ? '🚨 SCAM' : '✅ SAFE'}`);
    console.log(`💬 "${transcript}" | ⏱️ ${duration}s`);

    const result = await processCallAnalysis(callerId, duration, transcript);
    setLastCallResult(result);
    
    setTimeout(() => setIsTestingCall(false), 2000);
    loadStats();
  }, [loadStats, isTestingCall]);

  // Format session time
  const formatTime = useCallback((seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Event handlers
  const handleSliderChange = useCallback((e) => {
    setSensitivity(Number(e.target.value));
  }, []);

  const handleKeyPress = useCallback((e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      addCall();
    }
  }, [addCall]);

  // Persist sensitivity
  useEffect(() => {
    const saved = localStorage.getItem('sensitivity');
    if (saved) setSensitivity(Number(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('sensitivity', sensitivity.toString());
  }, [sensitivity]);

  // Effects
  useEffect(() => {
    loadStats();
    
    const sessionTimer = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);
    
    const statsInterval = setInterval(loadStats, 30000);
    
    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      clearInterval(sessionTimer);
      clearInterval(statsInterval);
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [loadStats, handleKeyPress]);

  // Auto-clear last result
  useEffect(() => {
    if (lastCallResult) {
      const timer = setTimeout(() => setLastCallResult(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [lastCallResult]);

  // Loading state
  if (loading) {
    return (
      <div className={`dashboard-loading ${darkMode ? 'dark-loading' : ''}`}>
        <div className="loading-spinner">🔄</div>
        <div>Loading Dashboard...</div>
        <div className="loading-subtext">Preparing spam protection...</div>
      </div>
    );
  }

  return (
    <div className={`dashboard-container ${darkMode ? 'dark-container' : ''}`} role="main">
      {/* Header */}
      <header className={`header ${darkMode ? 'dark-header' : ''}`}>
        <div className="header-top">
          <div className="header-logo">
            <img src="/VoxGuard_logo.png" alt="VoxGuard Logo" className="logo-img" />
          </div>
          <div className="dark-mode-toggle">
            <button onClick={toggleDarkMode} aria-label="Toggle dark mode">
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
        
        <div className="status-badge">
          <div className="status-indicator">
            <span className="status-dot" aria-label="Status: Active"></span>
            <span className="status-text">Protection Active</span>
          </div>
          <p className="status-subtitle">{backendStatus}</p>
          {error && <p className="error-text">{error}</p>}
        </div>
      </header>

      {/* Metrics Grid */}
      <section className="metrics-section" role="region" aria-label="Statistics">
        <div 
          className={`metric-card ${darkMode ? 'dark-card' : ''} test-call-card`}
          onClick={addCall}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && addCall()}
          aria-label="Test call detection"
          style={{ cursor: 'pointer' }}
        >
          <div className="metric-icon">📞</div>
          <p className="metric-label">Calls Detected</p>
          <p className="metric-value" aria-live="polite">{stats.callsDetected}</p>
          
          <div className="metric-hint">
            {lastCallResult ? (
              <div 
                className={`last-result ${lastCallResult.type} ${darkMode ? 'dark-result' : ''}`}
                role="alert"
                aria-live="assertive"
              >
                <span className="result-icon" aria-hidden="true">
                  {lastCallResult.type === 'spam' ? '🚨' : '✅'}
                </span>
                <span className="result-text">
                  {lastCallResult.demo && '(Demo) '}
                  {lastCallResult.message}
                  <small>{Math.round(lastCallResult.confidence)}% confidence</small>
                </span>
                {lastCallResult.matchedCount > 0 && (
                  <small className="result-count">
                    ({lastCallResult.matchedCount} matches)
                  </small>
                )}
                <div className="result-time">{lastCallResult.time}</div>
              </div>
            ) : isTestingCall ? (
              <div className="testing-state">
                <span>🧪 Testing...</span>
              </div>
            ) : (
              <span>👆 Click or Ctrl+Enter for test call!</span>
            )}
          </div>
        </div>
        
        <div className={`metric-card ${darkMode ? 'dark-card' : ''}`}>
          <div className="metric-icon">🚫</div>
          <p className="metric-label">Spam Blocked</p>
          <p className="metric-value">{stats.spamBlocked}</p>
          <div className="metric-hint">
            <span>{spamBlockRate}% block rate</span>
            <span>{backendStatus.includes('LIVE') ? 'Live' : 'Demo'}</span>
          </div>
        </div>
        
        <div className={`metric-card ${darkMode ? 'dark-card' : ''}`}>
          <div className="metric-icon">⏰</div>
          <p className="metric-label">Session Time</p>
          <p className="metric-value">{formatTime(sessionTime)}</p>
          <p className="metric-hint">Active</p>
        </div>
      </section>

      {/* Sensitivity Control */}
      <section className={`slider-section ${darkMode ? 'dark-section' : ''}`} role="region" aria-label="Sensitivity control">
        <div className="slider-header">
          <h3>🎛️ Detection Sensitivity</h3>
          <span className="slider-value" aria-live="polite">{sensitivity}%</span>
        </div>
        
        <div className="slider-container">
          <input
            type="range"
            min="0"
            max="100"
            value={sensitivity}
            onChange={handleSliderChange}
            className="sensitivity-slider"
            id="sensitivity-slider"
            aria-label="Detection sensitivity slider"
            aria-valuetext={`${sensitivity}%`}
          />
          <div className="slider-labels">
            <span>🔓 Allow More Calls</span>
            <span>🔒 Block More Spam</span>
          </div>
        </div>
        
        <div className="sensitivity-info">
          <div className={`level-indicator level-${sensitivityLevel}`}>
            {sensitivityLevel === 'low' && '🔒 Low Sensitivity'}
            {sensitivityLevel === 'medium' && '⚖️ Medium Sensitivity'}
            {sensitivityLevel === 'high' && '🔥 High Sensitivity'}
          </div>
        </div>
      </section>

      {/* Action Buttons */}
      <section className="buttons-section" role="navigation" aria-label="Quick actions">
        <button 
          className={`action-button ${darkMode ? 'dark-button' : ''}`}
          onClick={() => navigate('/manage-keywords')}
          aria-label="Manage spam keywords"
        >
          <span className="button-icon" aria-hidden="true">📝</span>
          <div className="button-text">
            <span>Manage Keywords</span>
            <span>Add custom spam triggers</span>
          </div>
        </button>
        
        <button 
          className={`action-button ${darkMode ? 'dark-button' : ''}`}
          onClick={() => navigate('/privacy-controls')}
          aria-label="Privacy and data controls"
        >
          <span className="button-icon" aria-hidden="true">🔐</span>
          <div className="button-text">
            <span>Privacy Controls</span>
            <span>Manage your data</span>
          </div>
        </button>
        
        <button 
          className={`action-button ${darkMode ? 'dark-button' : ''}`}
          onClick={() => navigate('/accuracy-check')}
          aria-label="View detailed accuracy statistics"
        >
          <span className="button-icon" aria-hidden="true">📊</span>
          <div className="button-text">
            <span>Accuracy Check</span>
            <span>Detailed analytics</span>
          </div>
        </button>
      </section>

      {/* Debug & Privacy */}
      <footer className={`footer-section ${darkMode ? 'dark-section' : ''}`}>
        <div className="debug-console">
          <h4>🔧 Debug Console</h4>
          <p>F12 → Console → Watch <strong>"SPAM DETECTED" vs "SAFE"</strong> + keywords!</p>
          <p><kbd>Ctrl + Enter</kbd> = Quick test call</p>
        </div>
        
        <div className="privacy-section">
          <h3>🔐 Privacy First</h3>
          <p>End-to-end encryption. Instant data purge. Never shared with third parties.</p>
        </div>
      </footer>
    </div>
  );
}

export default Dashboard;
