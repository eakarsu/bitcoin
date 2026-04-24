import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const verifyToken = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const response = await api.get('/api/auth/verify');
      setUser(response.data.user);
    } catch {
      localStorage.removeItem('token');
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  const login = async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
    }
    return response.data;
  };

  const register = async (email, password, name) => {
    const response = await api.post('/api/auth/register', { email, password, name });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
    }
    return response.data;
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Continue logout even if API fails
    }
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateProfile = async (data) => {
    const response = await api.put('/api/users/profile', data);
    setUser(prev => ({ ...prev, ...response.data }));
    return response.data;
  };

  const changePassword = async (currentPassword, newPassword) => {
    const response = await api.post('/api/auth/change-password', { currentPassword, newPassword });
    return response.data;
  };

  const requestPasswordReset = async (email) => {
    const response = await api.post('/api/auth/password-reset/request', { email });
    return response.data;
  };

  const confirmPasswordReset = async (token, password) => {
    const response = await api.post('/api/auth/password-reset/confirm', { token, password });
    return response.data;
  };

  const verifyEmail = async (token) => {
    const response = await api.post('/api/auth/verify-email', { token });
    setUser(prev => prev ? { ...prev, email_verified: true } : prev);
    return response.data;
  };

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout,
      updateProfile, changePassword,
      requestPasswordReset, confirmPasswordReset,
      verifyEmail, verifyToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export default AuthContext;
