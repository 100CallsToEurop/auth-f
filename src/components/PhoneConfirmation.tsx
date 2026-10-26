import { useState, type FormEvent } from 'react';
import { ApiError, type User } from '../lib/api';
import { confirmPhone } from '../lib/auth';

interface PhoneConfirmationProps {
  user: User;
  onChange: (user: User) => void;
}

/**
 * Условное подтверждение телефона: код никуда не отправляется, введённый
 * номер сразу сохраняется как подтверждённый. После этого открывается
 * редактирование профиля.
 */
export function PhoneConfirmation({ user, onChange }: PhoneConfirmationProps) {
  const [phone, setPhone] = useState(user.phone ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [justConfirmed, setJustConfirmed] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) {
      setError('Введите корректный номер телефона');
      return;
    }

    setError(null);
    setJustConfirmed(false);
    setSubmitting(true);
    try {
      const updated = await confirmPhone(phone.trim());
      onChange(updated);
      setPhone(updated.phone ?? '');
      setJustConfirmed(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Не удалось подтвердить номер телефона',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={`panel ${user.phoneVerified ? '' : 'panel-attention'}`}>
      <div className="panel-heading">
        <div>
          <h2>Телефон</h2>
          <p className="muted small">
            {user.phoneVerified
              ? 'Номер подтверждён — редактирование профиля доступно.'
              : 'Подтвердите номер, чтобы открыть редактирование профиля.'}
          </p>
        </div>
        <span className={`badge ${user.phoneVerified ? 'ok' : 'warn'}`}>
          {user.phoneVerified ? 'подтверждён' : 'не подтверждён'}
        </span>
      </div>

      {!user.phoneVerified && (
        <div className="notice">
          <span>Подтверждение условное.</span>
          <span className="muted small">
            Код не отправляется: введите номер, и он сразу будет считаться
            подтверждённым.
          </span>
        </div>
      )}

      {justConfirmed && (
        <div className="notice success" role="status">
          Номер подтверждён. Редактирование профиля открыто.
        </div>
      )}

      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}

      <form className="phone-form" onSubmit={(event) => void handleSubmit(event)}>
        <label className="field">
          <span>Номер телефона</span>
          <input
            type="tel"
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value);
              setJustConfirmed(false);
            }}
            autoComplete="tel"
            placeholder="+7 (999) 123-45-67"
            maxLength={32}
            required
          />
        </label>
        <button className="button" type="submit" disabled={submitting}>
          {submitting
            ? 'Сохранение…'
            : user.phoneVerified
              ? 'Изменить и подтвердить'
              : 'Подтвердить номер'}
        </button>
      </form>
    </section>
  );
}
