import { useEffect, useState } from 'react';
import { DEFAULT_PROVIDERS, type ProviderInfo, type User } from '../lib/api';
import {
  externalAuthUrl,
  externalSyncUrl,
  fetchProviders,
  unlinkProvider,
} from '../lib/auth';

interface ProviderButtonsProps {
  title?: string;
}

export function ProviderButtons({ title = 'Войти через' }: ProviderButtonsProps) {
  const [providers, setProviders] = useState<ProviderInfo[]>(DEFAULT_PROVIDERS);

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

  if (!providers.length) {
    return null;
  }

  return (
    <div className="providers">
      <div className="providers-title">{title}</div>
      {providers.map((provider) => (
        <a
          key={provider.slug}
          className="button secondary"
          href={externalAuthUrl(provider.slug)}
        >
          {provider.displayName}
        </a>
      ))}
    </div>
  );
}

interface ProviderSettingsProps {
  linked: string[];
  onChange: (user: User) => void;
  onError: (message: string) => void;
}

/** Управление способами входа: привязка, синхронизация и отвязка. */
export function ProviderSettings({ linked, onChange, onError }: ProviderSettingsProps) {
  const [providers, setProviders] = useState<ProviderInfo[]>(DEFAULT_PROVIDERS);
  const [busy, setBusy] = useState<string | null>(null);

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

  const handleUnlink = async (slug: string) => {
    setBusy(slug);
    try {
      onChange(await unlinkProvider(slug));
    } catch (err) {
      onError(
        err instanceof Error ? err.message : 'Не удалось отвязать провайдер',
      );
    } finally {
      setBusy(null);
    }
  };

  if (!providers.length) {
    return null;
  }

  return (
    <div className="providers">
      <div className="providers-title">Способы входа</div>
      {providers.map((provider) => {
        const isLinked = linked.includes(provider.slug);
        return (
          <div className="provider-row" key={provider.slug}>
            <span>{provider.displayName}</span>
            <div className="provider-actions">
              {isLinked && (
                <a
                  className="link"
                  href={externalSyncUrl(provider.slug)}
                  title="Обновить профиль из провайдера"
                >
                  Обновить
                </a>
              )}
              {isLinked ? (
                <button
                  type="button"
                  className="link danger"
                  onClick={() => void handleUnlink(provider.slug)}
                  disabled={busy === provider.slug}
                >
                  {busy === provider.slug ? '…' : 'Отвязать'}
                </button>
              ) : (
                <a className="link" href={externalAuthUrl(provider.slug)}>
                  Привязать
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
