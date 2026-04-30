import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'candidate' | 'batch-admin' | 'shared-admin' | 'root-admin';

export interface User {
  id: string;
  name: string;
  email: string;
  profilePic: string;
  role: UserRole;
  managedBatches?: string[]; // IDs of batches this user manages
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
    // Simulate Office 365 SSO login
    setUser({
      id: '1',
      name: 'Alex Johnson',
      email: 'alex.johnson@company.com',
      profilePic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
      role,
      managedBatches: role === 'batch-admin' ? ['cb-1'] : role === 'root-admin' ? undefined : ['cb-1'],
    });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
