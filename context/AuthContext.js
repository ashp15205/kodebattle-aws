'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('kb_token');
    const storedUser  = localStorage.getItem('kb_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const refreshProfile = useCallback(async (t) => {
    const tok = t || token;
    if (!tok) return;
    const res = await fetch('/api/user/profile', { headers: { Authorization: `Bearer ${tok}` } });
    if (res.ok) {
      const { user: u } = await res.json();
      setUser(u);
      localStorage.setItem('kb_user', JSON.stringify(u));
    }
  }, [token]);

  async function signUp(username, email, password) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    persist(data.user, data.token);
    return data;
  }

  async function signIn(email, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    persist(data.user, data.token);
    return data;
  }

  function persist(u, t) {
    setUser(u);
    setToken(t);
    localStorage.setItem('kb_token', t);
    localStorage.setItem('kb_user', JSON.stringify(u));
  }

  function signOut() {
    setUser(null);
    setToken(null);
    localStorage.removeItem('kb_token');
    localStorage.removeItem('kb_user');
  }

  function authHeader() {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, signUp, signIn, signOut, authHeader, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
