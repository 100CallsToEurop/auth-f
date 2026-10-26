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
import {
  confirmAccountLink as apiConfirmAccountLink,
  login as apiLogin,
  loginWithAccessToken,
  logout as apiLogout,
  refreshSession,
  register as apiRegister,
} from '../lib/auth';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string) => Promise<User>;
  /** Подтвердить владение аккаунтом и привязать к нему SSO-провайдера. */
  confirmAccountLink: (token: string, password: string) => Promise<User>;
  logout: () => Promise<string | null>;
}

interface AuthProviderProps {
  children: ReactNode;
  /** Access-токен из callback'а провайдера (фрагмент URL). */
  initialAccessToken?: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  initialAccessToken,
}: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        // После OAuth-callback'а backend вернул accessToken во фрагменте URL:
        // входим по нему сразу, не дожидаясь обмена refresh-cookie.
        const sessionUser = initialAccessToken
          ? await loginWithAccessToken(initialAccessToken)
          : (await refreshSession()).user;
        if (cancelled) return;
        setUser(sessionUser);
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
  }, [initialAccessToken]);

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

  const confirmAccountLink = useCallback(
    async (token: string, password: string): Promise<User> => {
      const session = await apiConfirmAccountLink(token, password);
      setUser(session.user);
      setStatus('authenticated');
      return session.user;
    },
    [],
  );

  const logout = useCallback(async (): Promise<string | null> => {
    let logoutUrl: string | null = null;
    try {
      logoutUrl = await apiLogout();
    } catch (error) {
      if (!(error instanceof ApiError)) {
        throw error;
      }
    }
    setUser(null);
    setStatus('unauthenticated');
    return logoutUrl;
  }, []);

  const value = useMemo(
    () => ({ user, status, login, register, confirmAccountLink, logout }),
    [user, status, login, register, confirmAccountLink, logout],
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
