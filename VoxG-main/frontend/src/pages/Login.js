import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🎯 Login clicked!'); // DEBUG
    
    setLoading(true);
    setError('');

    const result = await login(username, password); // ✅ Uses FIXED AuthContext
    
    if (result.success) {
      console.log('✅ Redirecting...');
      navigate('/'); // Dashboard
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div style={{
      maxWidth: '400px', margin: '50px auto', padding: '40px',
      border: '1px solid #ddd', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>🔐 VoxGuard Login</h1>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Username
          </label>
          <input
            type="text"
            placeholder="admin"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: '100%', padding: '12px', border: '2px solid #e1e5e9',
              borderRadius: '8px', fontSize: '16px'
            }}
            required
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Password
          </label>
          <input
            type="password"
            placeholder="admin123"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%', padding: '12px', border: '2px solid #e1e5e9',
              borderRadius: '8px', fontSize: '16px'
            }}
            required
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          style={{
            width: '100%', padding: '14px', 
            background: loading ? '#6c757d' : '#28a745',
            color: 'white', border: 'none', borderRadius: '8px',
            fontSize: '16px', fontWeight: 'bold', cursor: 'pointer'
          }}
        >
          {loading ? '🔄 Logging in...' : '🚀 LOGIN'}
        </button>
      </form>
      
      {error && (
        <div style={{
          marginTop: '20px', padding: '12px', background: '#f8d7da',
          color: '#721c24', borderRadius: '8px'
        }}>
          ❌ {error}
        </div>
      )}
      
      <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#666' }}>
        <strong>Demo:</strong> admin / admin123
      </div>
    </div>
  );
}

export default Login;