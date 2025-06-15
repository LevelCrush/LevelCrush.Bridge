import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, AuthTokens, LoginRequest, RegisterRequest } from '@/types';
import { authService } from '@/services/auth';
import { storage } from '@/lib/storage';

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (request: LoginRequest) => Promise<void>;
  register: (request: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    setTokens(null);
    storage.clearAuth();
  }, []);

  const refreshToken = useCallback(async () => {
    if (!tokens?.refresh_token) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await authService.refreshToken(tokens.refresh_token);
      setTokens(response.tokens);
      storage.setTokens(response.tokens);
    } catch (error) {
      logout();
      throw error;
    }
  }, [tokens, logout]);

  useEffect(() => {
    // Check for stored auth data on mount
    const storedTokens = storage.getTokens();
    const storedUser = storage.getUser();

    if (storedTokens && storedUser) {
      setTokens(storedTokens);
      setUser(storedUser);
      
      // Verify token is still valid
      authService.verifyToken(storedTokens.access_token)
        .then((isValid) => {
          if (!isValid) {
            // Try to refresh - but we can't use refreshToken here because it depends on state
            // Instead, directly call the service
            return authService.refreshToken(storedTokens.refresh_token)
              .then((response) => {
                setTokens(response.tokens);
                storage.setTokens(response.tokens);
              })
              .catch(() => {
                setUser(null);
                setTokens(null);
                storage.clearAuth();
              });
          }
        })
        .catch(() => {
          setUser(null);
          setTokens(null);
          storage.clearAuth();
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (request: LoginRequest) => {
    const response = await authService.login(request);
    setUser(response.user);
    setTokens(response.tokens);
    storage.setAuth(response.user, response.tokens);
  };

  const register = async (request: RegisterRequest) => {
    const response = await authService.register(request);
    setUser(response.user);
    setTokens(response.tokens);
    storage.setAuth(response.user, response.tokens);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    storage.setUser(updatedUser);
  };

  const value: AuthContextType = {
    user,
    tokens,
    isAuthenticated: !!user && !!tokens,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}