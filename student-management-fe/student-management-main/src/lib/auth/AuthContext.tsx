'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService, AuthUser } from '@/modules/auth/services/auth.service';

export type UserRole = 'admin' | 'teacher';

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
  isLoading: boolean;
  login: (email: string, password: string, expectedRole: UserRole) => Promise<boolean>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function toUser(account: AuthUser): User {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    role: account.role,
    avatarText: account.avatarText,
    title: account.title,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    authService.me()
      .then((account) => {
        if (active) setUser(toUser(account));
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string, expectedRole: UserRole): Promise<boolean> => {
    const account = await authService.login({
      username: email,
      password,
      role: expectedRole,
    });
    if (account.role !== expectedRole) {
      await authService.logout();
      throw new Error('Loại tài khoản không khớp với vai trò đã chọn. Vui lòng chọn đúng loại tài khoản.');
    }
    setUser(toUser(account));
    return true;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  }, []);

  // A client-side role switch must never grant a different server-side role.
  const switchRole = useCallback((_role: UserRole) => undefined, []);

  const role = user?.role ?? 'admin';
  const value = useMemo(() => ({
    user,
    role,
    isAuthenticated: user !== null,
    isLoading,
    login,
    logout,
    switchRole,
  }), [user, role, isLoading, login, logout, switchRole]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
