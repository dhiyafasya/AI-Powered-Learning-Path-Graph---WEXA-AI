import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const token = getToken();
    if (!token) {
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }
    api.auth
      .me()
      .then(({ user: me }) => {
        if (!cancelled) setUser(me);
      })
      .catch((err) => {
        if (err.status === 401) setToken(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const applyAuth = useCallback(({ user: u, token: t }) => {
    setToken(t);
    setUser(u);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const res = await api.auth.login({ email, password });
      applyAuth(res);
      return res.user;
    },
    [applyAuth]
  );

  const register = useCallback(
    async (name, email, password) => {
      const res = await api.auth.register({ name, email, password });
      applyAuth(res);
      return res.user;
    },
    [applyAuth]
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
