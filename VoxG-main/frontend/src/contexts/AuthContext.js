import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Use environment variable for API base URL
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001/api";

  // 🔥 Check token on startup
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
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
      console.log('🔐 Login attempt:', username);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      console.log('📡 Backend response:', data);

      if (!response.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      const token = data.token;
      localStorage.setItem('token', token);

      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser({ username: payload.user || username });

      console.log('✅ Login SUCCESS!');
      return { success: true };
    } catch (error) {
      console.error('❌ Login ERROR:', error);
      return { success: false, error: 'Backend offline or unreachable' };
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
