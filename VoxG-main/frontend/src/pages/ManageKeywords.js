// ✅ COMPLETE - Copy this entire file (ESLINT FIXED - NO SCANNER)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function ManageKeywords({ darkMode, toggleDarkMode }) {
  const navigate = useNavigate();
  const [keywords, setKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');
  const [backendStatus, setBackendStatus] = useState('❓ Checking...');

  useEffect(() => {
    checkBackend();
    loadKeywords();
  }, []);

  const checkBackend = async () => {
    try {
      const res = await fetch('http://localhost:5001/health');
      const data = await res.json();
      setBackendStatus(`✅ OK (${data.keywords || 0} keywords)`);
    } catch {
      setBackendStatus('❌ Backend OFFLINE - Start: cd backend && node server.js');
      setError('Backend not running!');
    }
  };

  const loadKeywords = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/keywords', {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      
      if (response.status === 401) {
        console.log('🔐 Need login...');
        return;
      }
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setKeywords(data.data || []);
      setError('');
    } catch (err) {
      if (err.message.includes('Failed to fetch')) {
        setError('Backend offline - Run: cd backend && node server.js');
      } else {
        setError('Load failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' })
      });
      const data = await res.json();
      localStorage.setItem('token', data.token);
      alert('✅ Logged in! Refreshing...');
      loadKeywords();
    } catch (err) {
      alert('❌ Backend not running!\n1. cd backend\n2. node server.js');
    }
  };

  const addKeyword = async () => {
    if (newKeyword.trim() === '') return;
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5001/api/keywords', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: newKeyword.trim() })
      });
      if (!res.ok) throw new Error('Add failed');
      setNewKeyword('');
      loadKeywords();
    } catch (err) {
      setError('Add failed');
    } finally {
      setSaving(false);
    }
  };

  const deleteKeyword = async (keywordId) => {
    if (!window.confirm('Delete?')) return;
    try {
      setDeleting(keywordId);
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5001/api/keywords/${keywordId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Delete failed');
      loadKeywords();
    } catch (err) {
      setError('Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <div className="loading">🔄 Loading...</div>;

  return (
    <div className={`page-container ${darkMode ? 'dark-container' : ''}`}>
      <button className={`back-button ${darkMode ? 'dark-back' : ''}`} onClick={() => navigate('/')}>
        ← Back
      </button>
      
      <button className={`dark-mode-toggle ${darkMode ? 'active' : ''}`} onClick={toggleDarkMode}>
        {darkMode ? '☀️' : '🌙'}
      </button>

      <div className={`page-content ${darkMode ? 'dark-page-content' : ''}`}>
        <h1>🔑 Manage Keywords</h1>
        
        {/* BACKEND STATUS */}
        <div className={`status ${backendStatus.includes('❌') ? 'error' : 'success'}`}>
          {backendStatus}
        </div>

        {/* QUICK LOGIN */}
        {!localStorage.getItem('token') && (
          <button className="login-button" onClick={quickLogin}>
            🔐 Login (admin/admin123)
          </button>
        )}

        {error && <div className="error-message">❌ {error}</div>}

        {/* ADD FORM */}
        <div className="add-box">
          <input
            placeholder="Add spam keyword..."
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
            className="keyword-input"
            disabled={saving}
          />
          <button onClick={addKeyword} disabled={saving || !newKeyword.trim()}>
            ➕ Add
          </button>
        </div>

        {/* LIST */}
        <div className="list">
          <h3>Keywords ({keywords.length})</h3>
          {keywords.map(kw => (
            <div key={kw.id} className="keyword-row">
              <span>📝 {kw.word}</span>
              <button onClick={() => deleteKeyword(kw.id)} disabled={deleting === kw.id}>
                {deleting === kw.id ? '⏳' : '🗑️'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .page-container { padding: 20px; max-width: 800px; margin: 0 auto; }
        .dark-container { background: #111; color: white; }
        .back-button, .login-button { 
          background: #3b82f6; color: white; border: none; 
          padding: 10px 20px; border-radius: 6px; cursor: pointer; margin: 10px;
        }
        .login-button { background: #10b981; }
        .status { padding: 10px; border-radius: 6px; margin: 10px 0; }
        .status.success { background: #d1fae5; color: #065f46; }
        .status.error { background: #fee2e2; color: #dc2626; }
        
        .add-box { display: flex; gap: 10px; margin: 20px 0; }
        .keyword-input { flex: 1; padding: 12px; border: 2px solid #ccc; border-radius: 6px; }
        .keyword-row { 
          display: flex; justify-content: space-between; 
          padding: 12px; background: #f0f0f0; margin: 5px 0; border-radius: 6px;
        }
        .dark-container .keyword-row { background: #1e293b; }
        button:hover:not(:disabled) { opacity: 0.9; }
        button:disabled { opacity: 0.5; cursor: not-allowed; }
        .error-message { background: #fee2e2; color: #dc2626; padding: 12px; border-radius: 6px; }
        .loading { text-align: center; padding: 40px; font-size: 18px; }
      `}</style>
    </div>
  );
}

export default ManageKeywords;
