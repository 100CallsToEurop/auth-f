import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError, type User } from '../lib/api';
import { fetchCurrentUser } from '../lib/auth';
import { ProviderSettings } from '../components/ProviderButtons';
import { SessionsPanel } from '../components/SessionsPanel';

const PROVIDER_LABELS: Record<string, string> = {
  password: 'Пароль',
  authentik: 'Authentik',
  yandex: 'Яндекс',
  github: 'GitHub',
  invision: 'Invision Community',
};

function displayName(user: User): string {
  if (user.displayName) {
    return user.displayName;
  }
  const composed = [user.firstName, user.lastName].filter(Boolean).join(' ');
  return composed || '—';
}

export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<User | null>(user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProfile(await fetchCurrentUser());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось загрузить профиль');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  const current = profile ?? user;
  if (!current) {
    return null;
  }

  return (
    <div className="page">
      <div className="card">
        <h1>Профиль</h1>
        {error && <div className="error">{error}</div>}
        <dl className="details">
          <div>
            <dt>Имя</dt>
            <dd>{loading && !profile ? '…' : displayName(current)}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{current.email}</dd>
          </div>
          <div>
            <dt>ID</dt>
            <dd>{current.id}</dd>
          </div>
          <div>
            <dt>Способы входа</dt>
            <dd className="chips">
              {current.providers?.length ? (
                current.providers.map((provider) => (
                  <span className="chip" key={provider}>
                    {PROVIDER_LABELS[provider] ?? provider}
                  </span>
                ))
              ) : (
                '—'
              )}
            </dd>
          </div>
        </dl>
        <ProviderSettings
          linked={current.providers ?? []}
          onChange={setProfile}
          onError={setError}
        />
        <SessionsPanel
          providers={current.providers ?? []}
          onLogout={() => navigate('/login', { replace: true })}
          onError={setError}
        />
        <button className="button secondary" onClick={() => void handleLogout()} disabled={loggingOut}>
          {loggingOut ? 'Выход…' : 'Выйти'}
        </button>
      </div>
    </div>
  );
}
