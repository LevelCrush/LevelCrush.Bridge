import { User, AuthTokens } from '@/types';

const STORAGE_KEYS = {
  USER: 'dynasty_trader_user',
  TOKENS: 'dynasty_trader_tokens',
  THEME: 'dynasty_trader_theme',
  PREFERENCES: 'dynasty_trader_preferences',
} as const;

class Storage {
  // Auth methods
  getUser(): User | null {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  }

  setUser(user: User): void {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  getTokens(): AuthTokens | null {
    const data = localStorage.getItem(STORAGE_KEYS.TOKENS);
    return data ? JSON.parse(data) : null;
  }

  setTokens(tokens: AuthTokens): void {
    localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens));
  }

  setAuth(user: User, tokens: AuthTokens): void {
    this.setUser(user);
    this.setTokens(tokens);
  }

  clearAuth(): void {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TOKENS);
  }

  // Theme methods
  getTheme(): 'light' | 'dark' {
    const theme = localStorage.getItem(STORAGE_KEYS.THEME);
    return (theme as 'light' | 'dark') || 'dark';
  }

  setTheme(theme: 'light' | 'dark'): void {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }

  // Preferences methods
  getPreferences<T extends Record<string, any>>(): T | null {
    const data = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    return data ? JSON.parse(data) : null;
  }

  setPreferences<T extends Record<string, any>>(preferences: T): void {
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
  }

  updatePreferences<T extends Record<string, any>>(updates: Partial<T>): void {
    const current = this.getPreferences<T>() || {} as T;
    const updated = { ...current, ...updates };
    this.setPreferences(updated);
  }

  // Generic methods
  get<T>(key: string): T | null {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  set<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  remove(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }
}

export const storage = new Storage();