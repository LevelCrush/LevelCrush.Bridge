export interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
  updated_at: string;
  discord_id?: string;
  discord_username?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}