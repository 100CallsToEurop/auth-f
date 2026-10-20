import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ApiError, setAccessToken, type User } from '../lib/api';
import { login as apiLogin, logout as apiLogout, refreshSession, register as apiRegister } from '../lib/auth';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const session = await refreshSession();
        if (cancelled) return;
        setUser(session.user);
        setStatus('authenticated');
      } catch {
        if (cancelled) return;
        setAccessToken(null);
        setUser(null);
        setStatus('unauthenticated');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const session = await apiLogin(email, password);
    setUser(session.user);
    setStatus('authenticated');
    return session.user;
  }, []);

  const register = useCallback(async (email: string, password: string): Promise<User> => {
    const session = await apiRegister(email, password);
    setUser(session.user);
    setStatus('authenticated');
    return session.user;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await apiLogout();
    } catch (error) {
      if (!(error instanceof ApiError)) {
        throw error;
      }
    }
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const value = useMemo(
    () => ({ user, status, login, register, logout }),
    [user, status, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
