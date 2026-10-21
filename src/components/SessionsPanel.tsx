import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../lib/api';
import {
  fetchSessions,
  logoutAll,
  revokeSession,
  type SessionInfo,
} from '../lib/auth';

interface SessionsPanelProps {
  /** Провайдеры входа аккаунта — для RP-initiated logout (Authentik). */
  providers: string[];
  onLogout: () => void;
  onError: (message: string) => void;
}

function describeSession(session: SessionInfo): string {
  if (!session.userAgent) {
    return 'Неизвестное устройство';
  }
  const ua = session.userAgent;
  const browser =
    /firefox/i.test(ua)
      ? 'Firefox'
      : /edg/i.test(ua)
        ? 'Edge'
        : /chrome/i.test(ua)
          ? 'Chrome'
          : /safari/i.test(ua)
            ? 'Safari'
            : 'Браузер';
  const os = /windows/i.test(ua)
    ? 'Windows'
    : /mac os|macintosh/i.test(ua)
      ? 'macOS'
      : /android/i.test(ua)
        ? 'Android'
        : /iphone|ipad|ios/i.test(ua)
          ? 'iOS'
          : /linux/i.test(ua)
            ? 'Linux'
            : '';
  return os ? `${browser} · ${os}` : browser;
}

function formatDate(value: string | null): string {
  if (!value) {
    return '—';
  }
  return new Date(value).toLocaleString();
}

export function SessionsPanel({ providers, onLogout, onError }: SessionsPanelProps) {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setSessions(await fetchSessions());
    } catch (err) {
      onError(
        err instanceof ApiError ? err.message : 'Не удалось загрузить сессии',
      );
    }
  }, [onError]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRevoke = async (id: string) => {
    setBusy(id);
    try {
      await revokeSession(id);
      await load();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Не удалось отозвать сессию');
    } finally {
      setBusy(null);
    }
  };

  const handleLogoutAll = async () => {
    setBusy('all');
    try {
      // SSO-провайдер для RP-initiated logout: OIDC-провайдеры аккаунта.
      const provider = providers.find((item) =>
        ['authentik'].includes(item),
      );
      const logoutUrl = await logoutAll(provider);
      if (logoutUrl) {
        window.location.href = logoutUrl;
        return;
      }
      onLogout();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Не удалось выполнить выход');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="sessions">
      <div className="providers-title">Активные сессии</div>
      {sessions.length === 0 ? (
        <div className="muted">Нет других активных сессий</div>
      ) : (
        sessions.map((session) => (
          <div className="provider-row" key={session.id}>
            <span>
              {describeSession(session)}
              {session.current && <span className="chip">текущая</span>}
              <div className="muted small">
                {session.ip ?? '—'} · вход: {formatDate(session.createdAt)}
              </div>
            </span>
            <div className="provider-actions">
              {!session.current && (
                <button
                  type="button"
                  className="link danger"
                  onClick={() => void handleRevoke(session.id)}
                  disabled={busy === session.id}
                >
                  {busy === session.id ? '…' : 'Завершить'}
                </button>
              )}
            </div>
          </div>
        ))
      )}
      <button
        className="button secondary"
        onClick={() => void handleLogoutAll()}
        disabled={busy === 'all'}
      >
        {busy === 'all' ? 'Выход…' : 'Выйти со всех устройств'}
      </button>
    </div>
  );
}
