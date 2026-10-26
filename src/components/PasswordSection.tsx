import { useState, type FormEvent } from 'react';
import { ApiError, type User } from '../lib/api';
import { setPassword } from '../lib/auth';

interface PasswordSectionProps {
  onChange: (user: User) => void;
}

/**
 * Создание пароля для аккаунта, у которого его нет (например, вход был только
 * через SSO). После этого аккаунт можно открывать по email и паролю.
 * Смена существующего пароля в этот раздел не входит.
 */
export function PasswordSection({ onChange }: PasswordSectionProps) {
  const [password, setPasswordValue] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      setError('Пароль должен быть не менее 8 символов');
      return;
    }
    if (password !== confirmation) {
      setError('Пароли не совпадают');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const updated = await setPassword(password);
      setPasswordValue('');
      setConfirmation('');
      onChange(updated);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Не удалось создать пароль',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="password-section">
      <p className="muted small">
        У аккаунта нет пароля. Создайте его, чтобы входить по email и паролю.
      </p>
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      <form className="card-form" onSubmit={(event) => void handleSubmit(event)}>
        <label className="field">
          <span>Новый пароль</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPasswordValue(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <label className="field">
          <span>Повторите пароль</span>
          <input
            type="password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <button className="button" type="submit" disabled={submitting}>
          {submitting ? 'Создание пароля…' : 'Создать пароль'}
        </button>
      </form>
    </div>
  );
}
