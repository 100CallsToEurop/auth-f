import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { ProviderSettings } from '../components/ProviderButtons';
import { useProfileOutlet } from './useProfileOutlet';

/** Привязка, синхронизация и отвязка внешних способов входа. */
export function ProvidersPage() {
  const { user, providers, updateUser, reportError } = useProfileOutlet();
  const hasPassword = user.providers?.includes('password') ?? false;

  return (
    <div className="page-content">
      <PageHeader
        title="Способы входа"
        description="Привязывайте внешние аккаунты, чтобы входить в личный кабинет в один клик."
      />

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Внешние провайдеры</h2>
            <p className="muted small">
              Привязанный аккаунт можно синхронизировать с профилем или отвязать.
            </p>
          </div>
        </div>
        {providers.length ? (
          <ProviderSettings
            providers={providers}
            linked={user.providers ?? []}
            onChange={updateUser}
            onError={reportError}
          />
        ) : (
          <div className="notice">
            <span>Внешние провайдеры не настроены.</span>
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Как это работает</h2>
        <ul className="plain-list">
          <li>
            <strong>Привязать</strong> — открывает провайдера и добавляет его к
            текущему аккаунту.
          </li>
          <li>
            <strong>Обновить</strong> — синхронизирует имя и email из профиля
            провайдера.
          </li>
          <li>
            <strong>Отвязать</strong> — удаляет способ входа. Пароль и остальные
            провайдеры продолжают работать.
          </li>
        </ul>
        <p className="muted small">
          Пароль настраивается отдельно — в разделе{' '}
          <Link className="link" to="/password">
            «Пароль»
          </Link>
          .{' '}
          {hasPassword
            ? 'Вход по email и паролю уже доступен.'
            : 'Сейчас вход по email и паролю недоступен.'}
        </p>
      </section>
    </div>
  );
}
