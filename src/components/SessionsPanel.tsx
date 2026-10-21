import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../lib/api';
import {
  fetchSessions,
  logoutAll,
  revokeOtherSessions,
  revokeSession,
  type SessionInfo,
} from '../lib/auth';

interface SessionsPanelProps {
  onError: (message: string) => void;
}

function formatDate(value: string | null): string {
  if (!value) {
    return '—';
  }
  return new Date(value).toLocaleString();
}

export function SessionsPanel({ onError }: SessionsPanelProps) {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const completeLogout = useCallback(() => {
    // Жёсткий переход на страницу входа — сбрасывает состояние приложения.
    window.location.href = '/login';
  }, []);

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

  const handleRevokeOthers = async () => {
    setBusy('others');
    try {
      await revokeOtherSessions();
      await load();
    } catch (err) {
      onError(
        err instanceof Error ? err.message : 'Не удалось завершить другие сессии',
      );
    } finally {
      setBusy(null);
    }
  };

  const handleLogoutAll = async () => {
    setBusy('all');
    try {
      // Бэкенд сам определяет провайдера текущей сессии: если вход был через
      // SSO (Authentik) — вернёт URL выхода из SSO, иначе просто выходим.
      const logoutUrl = await logoutAll();
      if (logoutUrl) {
        window.location.href = logoutUrl;
        return;
      }
      // Завершены все сессии (включая текущую) — уводим на страницу входа.
      completeLogout();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Не удалось выполнить выход');
    } finally {
      setBusy(null);
    }
  };

  const hasOtherSessions = sessions.some((session) => !session.current);

  return (
    <div className="sessions">
      <div className="providers-title">Активные сессии</div>
      {sessions.length === 0 ? (
        <div className="muted">Нет других активных сессий</div>
      ) : (
        sessions.map((session) => (
          <div className="provider-row" key={session.id}>
            <span>
              {session.device}
              {session.current && <span className="chip">текущая</span>}
              <div className="muted small">
                IP: {session.ip ?? '—'} · вход: {formatDate(session.createdAt)}
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
      <div className="sessions-actions">
        <button
          className="button secondary"
          onClick={() => void handleRevokeOthers()}
          disabled={busy !== null || !hasOtherSessions}
          title={
            hasOtherSessions
              ? 'Завершить все сессии, кроме текущей'
              : 'Других активных сессий нет'
          }
        >
          {busy === 'others' ? 'Завершение…' : 'Завершить другие сессии'}
        </button>
        <button
          className="button secondary"
          onClick={() => void handleLogoutAll()}
          disabled={busy !== null}
        >
          {busy === 'all' ? 'Выход…' : 'Выйти со всех устройств'}
        </button>
      </div>
    </div>
  );
}
