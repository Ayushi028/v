import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔥 Check token on startup
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token (simple check)
      try {
        // Decode without verification for UI
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ username: payload.user || 'admin' });
      } catch {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      console.log('🔐 Login attempt:', username); // DEBUG
      
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      console.log('📡 Backend response:', data); // DEBUG

      if (!response.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      // ✅ Backend sends { token }
      const token = data.token;
      localStorage.setItem('token', token);
      
      // Decode token for user info
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser({ username: payload.user || username });
      
      console.log('✅ Login SUCCESS!');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Login ERROR:', error);
      return { 
        success: false, 
        error: 'Backend offline? Check server.js on port 5001' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading,
    token: localStorage.getItem('token')
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};