import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
  type SVGProps,
} from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ApiError,
  isSafeRedirect,
  type ProviderInfo,
  type User,
} from '../lib/api';
import { fetchCurrentUser, fetchProviders } from '../lib/auth';
import { displayName, initials } from '../lib/user';

type IconProps = SVGProps<SVGSVGElement> & { children: ReactNode };

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

function ProfileIcon() {
  return (
    <Icon>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
    </Icon>
  );
}

function ProvidersIcon() {
  return (
    <Icon>
      <circle cx="8" cy="15" r="4" />
      <path d="m10.8 12.2 8-8" />
      <path d="m16 5 3 3" />
      <path d="m13.5 7.5 3 3" />
    </Icon>
  );
}

function PasswordIcon() {
  return (
    <Icon>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </Icon>
  );
}

function SessionsIcon() {
  return (
    <Icon>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8" />
      <path d="M12 16v4" />
    </Icon>
  );
}

function LogoutIcon() {
  return (
    <Icon>
      <path d="m10 17 5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M15 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
    </Icon>
  );
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'nav-link active' : 'nav-link';

/**
 * Оболочка личного кабинета: левое меню и общие данные профиля.
 * Профиль и список провайдеров загружаются один раз и передаются страницам
 * через Outlet context, поэтому переключение разделов не повторяет запросы.
 */
export function AppLayout() {
  const { user: sessionUser, logout } = useAuth();
  const [user, setUser] = useState<User | null>(sessionUser);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const current = await fetchCurrentUser();
        if (!cancelled) {
          setUser(current);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : 'Не удалось загрузить профиль',
          );
        }
      }
    })();

    void fetchProviders().then((list) => {
      if (!cancelled) {
        setProviders(list);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const updateUser = useCallback((next: User) => {
    setUser(next);
  }, []);

  const reportError = useCallback((message: string) => {
    setError(message);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const logoutUrl = await logout();
      if (logoutUrl && isSafeRedirect(logoutUrl)) {
        window.location.href = logoutUrl;
        return;
      }
      window.location.href = '/login';
    } catch {
      setError('Не удалось выйти');
    } finally {
      setLoggingOut(false);
    }
  };

  if (!user) {
    return (
      <div className="page">
        <div
          className="spinner"
          role="status"
          aria-live="polite"
          aria-label="Загрузка"
        />
      </div>
    );
  }

  const hasPassword = user.providers?.includes('password') ?? false;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <Link className="sidebar-brand" to="/profile">
            <span className="brand-mark" aria-hidden="true">
              ЛК
            </span>
            <span>Личный кабинет</span>
          </Link>

          <div className="sidebar-user">
            <div className="avatar" aria-hidden="true">
              {initials(user)}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name" title={displayName(user)}>
                {displayName(user)}
              </div>
              <div className="sidebar-user-email" title={user.email}>
                {user.email}
              </div>
            </div>
          </div>
        </div>

        <nav className="nav" aria-label="Разделы профиля">
          <div className="nav-group">
            <div className="nav-title">Аккаунт</div>
            <NavLink to="/profile" className={navLinkClass}>
              <ProfileIcon />
              <span>Профиль</span>
            </NavLink>
            <NavLink to="/providers" className={navLinkClass}>
              <ProvidersIcon />
              <span>Способы входа</span>
            </NavLink>
          </div>

          <div className="nav-group">
            <div className="nav-title">Безопасность</div>
            <NavLink to="/password" className={navLinkClass}>
              <PasswordIcon />
              <span>Пароль</span>
              {!hasPassword && <span className="nav-badge">не задан</span>}
            </NavLink>
            <NavLink to="/sessions" className={navLinkClass}>
              <SessionsIcon />
              <span>Сессии</span>
            </NavLink>
          </div>
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-logout"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
          >
            <LogoutIcon />
            <span>{loggingOut ? 'Выход…' : 'Выйти'}</span>
          </button>
        </div>
      </aside>

      <main className="app-main">
        <div className="app-content">
          {error && (
            <div className="app-error" role="alert">
              <span>{error}</span>
              <button
                type="button"
                className="app-error-close"
                onClick={() => setError(null)}
                aria-label="Закрыть сообщение"
              >
                ×
              </button>
            </div>
          )}
          <Outlet
            context={{ user, providers, updateUser, reportError }}
          />
        </div>
      </main>
    </div>
  );
}
