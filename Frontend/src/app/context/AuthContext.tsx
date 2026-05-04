import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'Candidate' | 'Admin' | 'SuperAdmin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (role: UserRole) => {
    // Placeholder — will be replaced with real MSAL/Entra ID SSO flow
    // Role is fetched from DB via GET /me after JWT validation, not from JWT claims
    setUser({
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Alex Johnson',
      email: 'alex.johnson@company.com',
      role,
    });
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
