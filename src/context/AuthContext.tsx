import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { SESSION_VERIFY_USER_ID_KEY, meResponseToUser } from '../utils/authRedirect';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  verifyOtp: (otp: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const data = await api.getMe();
    setUser(meResponseToUser(data));
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await api.getCsrf();
        await refreshUser();
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, [refreshUser]);

  const login = async (credentials: { username: string; password: string }) => {
    await api.login(credentials);
  };

  const verifyOtp = async (otp: string) => {
    const rawId = sessionStorage.getItem(SESSION_VERIFY_USER_ID_KEY);
    const userId = rawId ? parseInt(rawId, 10) : undefined;
    await api.verifyOtp(otp, Number.isFinite(userId) ? userId : undefined);
    sessionStorage.removeItem(SESSION_VERIFY_USER_ID_KEY);
    await refreshUser();
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, login, verifyOtp, logout, loading, setUser, refreshUser }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
