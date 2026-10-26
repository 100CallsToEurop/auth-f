import { useEffect, useState } from 'react';
import { type ProviderInfo, type User } from '../lib/api';
import {
  fetchProviders,
  providerAuthUrl,
  providerLinkUrl,
  providerSyncUrl,
  unlinkProvider,
} from '../lib/auth';

interface ProviderButtonsProps {
  title?: string;
}

export function ProviderButtons({ title = 'Войти через' }: ProviderButtonsProps) {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);

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
          href={providerAuthUrl(provider.slug)}
          title={`Перейти к ${provider.displayName} и вернуться уже вошедшим`}
        >
          {provider.displayName}
        </a>
      ))}
    </div>
  );
}

interface ProviderSettingsProps {
  providers: ProviderInfo[];
  linked: string[];
  onChange: (user: User) => void;
  onError: (message: string) => void;
}

/** Управление способами входа: привязка, синхронизация и отвязка. */
export function ProviderSettings({
  providers,
  linked,
  onChange,
  onError,
}: ProviderSettingsProps) {
  const [busy, setBusy] = useState<string | null>(null);

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
    <div className="provider-list">
      {providers.map((provider) => {
        const isLinked = linked.includes(provider.slug);
        return (
          <div className="provider-row" key={provider.slug}>
            <div className="provider-info">
              <span>{provider.displayName}</span>
              <span className={`badge ${isLinked ? 'ok' : ''}`}>
                {isLinked ? 'Привязан' : 'Не привязан'}
              </span>
            </div>
            <div className="provider-actions">
              {isLinked && (
                // Синхронизация меняет данные аккаунта — только POST, иначе
                // состояние менялось бы обычным переходом по ссылке.
                <form
                  method="post"
                  action={providerSyncUrl(provider.slug)}
                  className="inline-form"
                >
                  <button type="submit" className="link" title="Обновить профиль из провайдера">
                    Обновить
                  </button>
                </form>
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
                // Привязка нового способа входа к текущему аккаунту.
                <form
                  method="post"
                  action={providerLinkUrl(provider.slug)}
                  className="inline-form"
                >
                  <button type="submit" className="link">
                    Привязать
                  </button>
                </form>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
