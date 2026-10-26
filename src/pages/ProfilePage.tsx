import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { providerLabel } from '../lib/providers';
import { displayName, initials } from '../lib/user';
import { useProfileOutlet } from './useProfileOutlet';

/** Основные сведения об аккаунте. */
export function ProfilePage() {
  const { user, providers } = useProfileOutlet();
  const linked = user.providers ?? [];
  const hasPassword = linked.includes('password');
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');

  return (
    <div className="page-content">
      <PageHeader
        title="Профиль"
        description="Основная информация об аккаунте и подключённых способах входа."
      />

      <section className="profile-hero">
        <div className="avatar avatar-large" aria-hidden="true">
          {initials(user)}
        </div>
        <div className="profile-hero-info">
          <h2>{displayName(user)}</h2>
          <div className="muted">{user.email}</div>
          <div className="chips">
            {linked.length ? (
              linked.map((slug) => (
                <span className="chip" key={slug}>
                  {providerLabel(providers, slug)}
                </span>
              ))
            ) : (
              <span className="muted small">Способы входа не указаны</span>
            )}
          </div>
        </div>
      </section>

      <div className="panel-grid">
        <section className="panel">
          <h2>Учётная запись</h2>
          <dl className="details-grid">
            <div>
              <dt>Имя</dt>
              <dd>{fullName || '—'}</dd>
            </div>
            <div>
              <dt>Отображаемое имя</dt>
              <dd>{user.displayName || '—'}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>ID</dt>
              <dd className="mono">{user.id}</dd>
            </div>
          </dl>
        </section>

        <section className="panel">
          <h2>Безопасность</h2>
          <ul className="summary-list">
            <li>
              <div>
                <div>Пароль</div>
                <div className="muted small">
                  {hasPassword
                    ? 'задан — доступен вход по email и паролю'
                    : 'не задан — вход только через провайдеров'}
                </div>
              </div>
              <Link className="link" to="/password">
                {hasPassword ? 'Подробнее' : 'Создать'}
              </Link>
            </li>
            <li>
              <div>
                <div>Способы входа</div>
                <div className="muted small">Подключено: {linked.length}</div>
              </div>
              <Link className="link" to="/providers">
                Настроить
              </Link>
            </li>
            <li>
              <div>
                <div>Активные сессии</div>
                <div className="muted small">
                  Устройства, с которых выполнен вход
                </div>
              </div>
              <Link className="link" to="/sessions">
                Открыть
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
