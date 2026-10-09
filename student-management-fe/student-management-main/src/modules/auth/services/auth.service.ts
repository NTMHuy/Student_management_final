import { LoginCredentials, AuthSession } from "../types";
import { defaultAccounts } from "../mocks/auth.mock";

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const account = defaultAccounts[credentials.role];
        resolve({
          token: `fake-jwt-token-${Date.now()}`,
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
          user: {
            id: `usr-${credentials.role}-01`,
            name: account.name,
            email: credentials.username || account.email,
            role: credentials.role,
            title: account.title,
          },
        });
      }, 500);
    });
  },

  async logout(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 200));
  },
};
