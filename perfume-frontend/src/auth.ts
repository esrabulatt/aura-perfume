import { createContext, useContext } from 'react';
import type { User } from './types';

// JWT tarayıcıda saklanır; sayfa yenilenince GET /api/auth/me ile doğrulanır
export const TOKEN_KEY = 'aura-auth-token';

export const loadToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const saveToken = (token: string | null) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // depolama kapalıysa oturum yalnızca bu sekmede sürer
  }
};

export interface AuthContextValue {
  user: User | null;
  openAuth: (mode?: 'login' | 'register') => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue>({ user: null, openAuth: () => {}, logout: () => {} });
export const useAuth = () => useContext(AuthContext);
