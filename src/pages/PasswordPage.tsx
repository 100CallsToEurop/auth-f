import { PageHeader } from '../components/PageHeader';
import { PasswordSection } from '../components/PasswordSection';
import { useProfileOutlet } from '../pages/useProfileOutlet';

/** Создание или смена пароля для входа по email. */
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
        <h2>{hasPassword ? 'Смена пароля' : 'Создание пароля'}</h2>
        <PasswordSection hasPassword={hasPassword} onChange={updateUser} />
      </section>
    </div>
  );
}
