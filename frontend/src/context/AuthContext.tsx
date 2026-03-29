// Placeholder for AuthContext
// Will be implemented in the next iteration

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: { fullName: string; email: string; phone: string; password: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    // TODO: Implement login logic with API
    console.log('Login:', email, password);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('buildestate_token');
  };

  const register = async (data: { fullName: string; email: string; phone: string; password: string }) => {
    // TODO: Implement registration logic with API
    console.log('Register:', data);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      logout,
      register,
    }}>
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
