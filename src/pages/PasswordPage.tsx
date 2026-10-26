import { PageHeader } from '../components/PageHeader';
import { PasswordSection } from '../components/PasswordSection';
import { useProfileOutlet } from './useProfileOutlet';

/** Создание пароля для входа по email. */
export function PasswordPage() {
  const { user, updateUser } = useProfileOutlet();
  const hasPassword = user.providers?.includes('password') ?? false;

  return (
    <div className="page-content">
      <PageHeader
        title="Пароль"
        description="Пароль позволяет входить по email, не используя внешние сервисы."
      />

      <section className="panel">
        {hasPassword ? (
          <div className="notice" role="status">
            <span>Пароль задан.</span>
            <span className="muted small">
              Используйте email {user.email} и этот пароль на странице входа.
            </span>
          </div>
        ) : (
          <PasswordSection onChange={updateUser} />
        )}
      </section>
    </div>
  );
}
