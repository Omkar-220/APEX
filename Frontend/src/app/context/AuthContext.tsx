import React, { createContext, useContext, useState, ReactNode } from 'react';
import { login as apiLogin, register as apiRegister } from '../services/apiService';
import { setAuthToken } from '../services/api';

export type UserRole = 'Candidate' | 'Admin' | 'SuperAdmin';

interface User {
  candidateId: string;
  displayName: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiLogin(email, password);
      setAuthToken(response.token);
      setUser({
        candidateId: response.candidateId,
        displayName: response.displayName,
        email: response.email,
        role: response.role as UserRole,
      });
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? 'Login failed. Please check your credentials.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRegister(email, password, displayName);
      setAuthToken(response.token);
      setUser({
        candidateId: response.candidateId,
        displayName: response.displayName,
        email: response.email,
        role: response.role as UserRole,
      });
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? 'Registration failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setAuthToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
