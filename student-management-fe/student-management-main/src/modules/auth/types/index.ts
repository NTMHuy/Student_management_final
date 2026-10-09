import { UserRole } from '@/lib/auth/AuthContext';

export interface LoginCredentials {
  username: string;
  password?: string;
  role: UserRole;
  rememberMe?: boolean;
}

export interface AuthSession {
  token: string;
  expiresAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    title: string;
  };
}
