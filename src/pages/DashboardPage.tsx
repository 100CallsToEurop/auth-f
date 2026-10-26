import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiError, isSafeRedirect, type ProviderInfo, type User } from '../lib/api';
import { fetchCurrentUser, fetchProviders } from '../lib/auth';
import { ProviderSettings } from '../components/ProviderButtons';
import { PasswordSection } from '../components/PasswordSection';
import { SessionsPanel } from '../components/SessionsPanel';

/** Локальный способ входа — его нет в реестре внешних провайдеров. */
const LOCAL_PROVIDER_LABELS: Record<string, string> = {
  password: 'Пароль',
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
  const [profile, setProfile] = useState<User | null>(null);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
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

  useEffect(() => {
    let cancelled = false;
    void fetchProviders().then((list) => {
      if (!cancelled) {
        setProviders(list);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Названия способов входа берём из API, а не из второй копии в коде.
  const providerLabels = useMemo(() => {
    const labels: Record<string, string> = { ...LOCAL_PROVIDER_LABELS };
    for (const provider of providers) {
      labels[provider.slug] = provider.displayName;
    }
    return labels;
  }, [providers]);

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

  const current = profile ?? user;
  if (!current) {
    return null;
  }

  return (
    <div className="page">
      <div className="card">
        <h1>Профиль</h1>
        {error && <div className="error" role="alert">{error}</div>}
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
                    {providerLabels[provider] ?? provider}
                  </span>
                ))
              ) : (
                '—'
              )}
            </dd>
          </div>
        </dl>
        {profile && (
          <PasswordSection user={profile} onChange={setProfile} />
        )}
        <ProviderSettings
          providers={providers}
          linked={current.providers ?? []}
          onChange={setProfile}
          onError={setError}
        />
        <SessionsPanel onError={setError} />
        <button className="button secondary" onClick={() => void handleLogout()} disabled={loggingOut}>
          {loggingOut ? 'Выход…' : 'Выйти'}
        </button>
      </div>
    </div>
  );
}
