import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';


const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('irms_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('irms_token', res.data.token);
    localStorage.setItem('irms_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch (_) {}
    localStorage.removeItem('irms_token');
    localStorage.removeItem('irms_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
