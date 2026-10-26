import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { PhoneConfirmation } from '../components/PhoneConfirmation';
import { ProfileForm } from '../components/ProfileForm';
import { providerLabel } from '../lib/providers';
import { displayName, initials } from '../lib/user';
import { useProfileOutlet } from './useProfileOutlet';

/** Основные сведения об аккаунте: личные данные, телефон и способы входа. */
export function ProfilePage() {
  const { user, providers, updateUser } = useProfileOutlet();
  const linked = user.providers ?? [];
  const hasPassword = linked.includes('password');

  return (
    <div className="page-content">
      <PageHeader
        title="Профиль"
        description="Личные данные, телефон и подключённые способы входа."
      />

      <section className="profile-hero">
        <div className="avatar avatar-large" aria-hidden="true">
          {initials(user)}
        </div>
        <div className="profile-hero-info">
          <h2>{displayName(user)}</h2>
          <div className="muted">{user.email}</div>
          {user.position && (
            <div className="muted small">{user.position}</div>
          )}
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

      <PhoneConfirmation user={user} onChange={updateUser} />

      <div className="panel-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Личные данные</h2>
              <p className="muted small">
                {user.phoneVerified
                  ? 'Данные можно менять в любой момент.'
                  : 'Доступно после подтверждения телефона.'}
              </p>
            </div>
          </div>
          <ProfileForm user={user} onChange={updateUser} />
        </section>

        <section className="panel">
          <h2>Учётная запись</h2>
          <dl className="details-grid">
            <div>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>Телефон</dt>
              <dd>{user.phone || '—'}</dd>
            </div>
            <div>
              <dt>Организация</dt>
              <dd>{user.organization || '—'}</dd>
            </div>
            <div>
              <dt>Отображаемое имя</dt>
              <dd>{user.displayName || '—'}</dd>
            </div>
            <div>
              <dt>ID</dt>
              <dd className="mono">{user.id}</dd>
            </div>
          </dl>
        </section>
      </div>

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
              {hasPassword ? 'Изменить' : 'Создать'}
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
  );
}
