import { api } from '@/lib/api';
import { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  AuthTokens 
} from '@/types';

export const authService = {
  async login(request: LoginRequest): Promise<AuthResponse> {
    return api.post<AuthResponse>('/auth/login', request);
  },

  async register(request: RegisterRequest): Promise<AuthResponse> {
    return api.post<AuthResponse>('/auth/register', request);
  },

  async logout(): Promise<void> {
    return api.post('/auth/logout');
  },

  async refreshToken(refreshToken: string): Promise<{ tokens: AuthTokens }> {
    return api.post<{ tokens: AuthTokens }>('/auth/refresh', {
      refresh_token: refreshToken,
    });
  },

  async verifyToken(token: string): Promise<boolean> {
    try {
      // The verify endpoint now returns user data, but we just care if it succeeds
      await api.get('/auth/verify', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return true;
    } catch {
      return false;
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  async requestPasswordReset(email: string): Promise<void> {
    return api.post('/auth/request-reset', { email });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    return api.post('/auth/reset-password', {
      token,
      new_password: newPassword,
    });
  },
};