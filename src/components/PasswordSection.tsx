import { useState, type FormEvent } from 'react';
import { ApiError, type User } from '../lib/api';
import { setPassword } from '../lib/auth';

interface PasswordSectionProps {
  hasPassword: boolean;
  onChange: (user: User) => void;
}

/**
 * Создание пароля для аккаунта без пароля (вход был только через SSO) или
 * смена существующего пароля. При смене сервер требует текущий пароль.
 */
export function PasswordSection({ hasPassword, onChange }: PasswordSectionProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPasswordValue] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (hasPassword && !currentPassword) {
      setError('Введите текущий пароль');
      return;
    }
    if (password.length < 8) {
      setError('Пароль должен быть не менее 8 символов');
      return;
    }
    if (password.length > 128) {
      setError('Пароль должен быть не длиннее 128 символов');
      return;
    }
    if (password !== confirmation) {
      setError('Пароли не совпадают');
      return;
    }

    setError(null);
    setSaved(false);
    setSubmitting(true);
    try {
      const updated = await setPassword(
        password,
        hasPassword ? currentPassword : undefined,
      );
      setCurrentPassword('');
      setPasswordValue('');
      setConfirmation('');
      setSaved(true);
      onChange(updated);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : hasPassword
            ? 'Не удалось изменить пароль'
            : 'Не удалось создать пароль',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="password-section">
      <p className="muted small">
        {hasPassword
          ? 'Пароль задан: используйте email и пароль на странице входа.'
          : 'У аккаунта нет пароля. Создайте его, чтобы входить по email и паролю.'}
      </p>
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      {saved && (
        <div className="notice success" role="status">
          {hasPassword ? 'Пароль изменён.' : 'Пароль создан.'}
        </div>
      )}
      <form className="card-form" onSubmit={(event) => void handleSubmit(event)}>
        {hasPassword && (
          <label className="field">
            <span>Текущий пароль</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => {
                setCurrentPassword(event.target.value);
                setSaved(false);
              }}
              autoComplete="current-password"
              maxLength={128}
              required
            />
          </label>
        )}
        <label className="field">
          <span>{hasPassword ? 'Новый пароль' : 'Пароль'}</span>
          <input
            type="password"
            value={password}
            onChange={(event) => {
              setPasswordValue(event.target.value);
              setSaved(false);
            }}
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
          />
        </label>
        <label className="field">
          <span>Повторите пароль</span>
          <input
            type="password"
            value={confirmation}
            onChange={(event) => {
              setConfirmation(event.target.value);
              setSaved(false);
            }}
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
          />
        </label>
        <button className="button" type="submit" disabled={submitting}>
          {submitting
            ? hasPassword
              ? 'Сохранение…'
              : 'Создание пароля…'
            : hasPassword
              ? 'Изменить пароль'
              : 'Создать пароль'}
        </button>
      </form>
    </div>
  );
}
