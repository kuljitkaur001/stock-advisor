import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, CountryEnum } from '../types';
import { authApi } from '../api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name: string, country: CountryEnum) => Promise<void>;
  logout: () => void;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMe = async () => {
    try {
      if (token) {
        const u = await authApi.getMe();
        setUser(u);
      } else {
        setUser(null);
      }
    } catch {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, [token]);

  const login = async (email: string, pass: string) => {
    const res = await authApi.login({ email, password: pass });
    localStorage.setItem('token', res.access_token);
    setToken(res.access_token);
    const u = await authApi.getMe();
    setUser(u);
  };

  const signup = async (email: string, pass: string, name: string, country: CountryEnum) => {
    await authApi.signup({ email, password: pass, full_name: name, preferred_country: country });
    await login(email, pass);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, refetchUser: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
