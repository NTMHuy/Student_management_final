'use client';
import React, { createContext, useContext, useState } from 'react';export type UserRole = 'admin' | 'teacher';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarText: string;
  title: string;
}

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (email: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const defaultAdminUser: User = {
  id: 'admin-01',
  name: 'Nguyễn Văn An',
  email: 'admin@edumanage.edu.vn',
  role: 'admin',
  avatarText: 'NA',
  title: 'Quản trị viên',
};

const defaultTeacherUser: User = {
  id: 'teacher-01',
  name: 'Nguyễn Văn An',
  email: 'gv.nguyenvana@edumanage.edu.vn',
  role: 'teacher',
  avatarText: 'NA',
  title: 'Quản trị viên / Giáo viên',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(defaultAdminUser);
  const [role, setRole] = useState<UserRole>('admin');

  const login = async (email: string, targetRole: UserRole): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const loggedUser = targetRole === 'admin' ? defaultAdminUser : defaultTeacherUser;
        setUser({ ...loggedUser, email: email || loggedUser.email });
        setRole(targetRole);
        resolve(true);
      }, 600);
    });
  };

  const logout = () => {
    setUser(null);
  };

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    setUser(newRole === 'admin' ? defaultAdminUser : defaultTeacherUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
