import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AccuracyCheck({ darkMode, toggleDarkMode }) {
  const navigate = useNavigate();
  const [accuracy, setAccuracy] = useState(94);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const runAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setAccuracy(Math.floor(Math.random() * (99 - 85) + 85));
      setIsAnalyzing(false);
    }, 2000);
  };

  return (
    <div className={`page-container ${darkMode ? 'dark-container' : ''}`}>
      <button 
        className={`back-button ${darkMode ? 'dark-back' : ''}`} 
        onClick={() => navigate('/')}
      >
        ← Back to Dashboard
      </button>

      {/* Dark Mode Toggle */}
      <button 
        className={`dark-mode-toggle ${darkMode ? 'active' : ''}`}
        onClick={toggleDarkMode}
        title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {darkMode ? '☀️' : '🌙'}
      </button>
      
      <div className={`page-content ${darkMode ? 'dark-page-content' : ''}`}>
        <div className="page-header">
          <span className="page-icon">🎯</span>
          <h1>Detection Accuracy</h1>
        </div>
        
        <p className="page-description">
          Check how accurately the spam detection system identifies unwanted calls.
        </p>

        {/* Accuracy Display */}
        <div className="accuracy-display">
          <div className={`accuracy-circle ${darkMode ? 'dark-accuracy-circle' : ''}`}>
            <span className="accuracy-value">{accuracy}%</span>
            <span className="accuracy-label">Accuracy</span>
          </div>
        </div>

        {/* Analyze Button */}
        <button 
          onClick={runAnalysis} 
          className={`analyze-button ${darkMode ? 'dark-analyze-button' : ''}`}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? '🔄 Analyzing...' : '▶️ Run Analysis'}
        </button>

        {/* Stats */}
        <div className="accuracy-stats">
          <div className={`stat-item ${darkMode ? 'dark-stat-item' : ''}`}>
            <span className="stat-icon">✅</span>
            <div>
              <h4>Correctly Blocked</h4>
              <p>156 calls</p>
            </div>
          </div>
          <div className={`stat-item ${darkMode ? 'dark-stat-item' : ''}`}>
            <span className="stat-icon">❌</span>
            <div>
              <h4>False Positives</h4>
              <p>10 calls</p>
            </div>
          </div>
          <div className={`stat-item ${darkMode ? 'dark-stat-item' : ''}`}>
            <span className="stat-icon">📞</span>
            <div>
              <h4>Total Analyzed</h4>
              <p>166 calls</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccuracyCheck;