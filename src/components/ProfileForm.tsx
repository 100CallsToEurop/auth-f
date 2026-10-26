import { useState, type FormEvent } from 'react';
import { ApiError, type User } from '../lib/api';
import { updateProfile, type ProfileUpdateInput } from '../lib/auth';

interface ProfileFormProps {
  user: User;
  onChange: (user: User) => void;
}

interface FormValues {
  firstName: string;
  lastName: string;
  middleName: string;
  organization: string;
  position: string;
}

function toValues(user: User): FormValues {
  return {
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    middleName: user.middleName ?? '',
    organization: user.organization ?? '',
    position: user.position ?? '',
  };
}

function toInput(values: FormValues): ProfileUpdateInput {
  const clean = (value: string) => value.trim() || null;
  return {
    firstName: clean(values.firstName),
    lastName: clean(values.lastName),
    middleName: clean(values.middleName),
    organization: clean(values.organization),
    position: clean(values.position),
  };
}

/** Редактирование личных данных; доступно только после подтверждения телефона. */
export function ProfileForm({ user, onChange }: ProfileFormProps) {
  const [values, setValues] = useState<FormValues>(() => toValues(user));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const disabled = !user.phoneVerified;

  const update = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setSaved(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (disabled) {
      setError('Подтвердите номер телефона, чтобы редактировать профиль');
      return;
    }

    setError(null);
    setSaved(false);
    setSubmitting(true);
    try {
      const updated = await updateProfile(toInput(values));
      onChange(updated);
      setValues(toValues(updated));
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Не удалось сохранить изменения',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="profile-form" onSubmit={(event) => void handleSubmit(event)}>
      {disabled && (
        <div className="notice">
          <span>Редактирование профиля недоступно.</span>
          <span className="muted small">
            Сначала подтвердите номер телефона.
          </span>
        </div>
      )}
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      {saved && (
        <div className="notice success" role="status">
          Изменения сохранены.
        </div>
      )}

      <fieldset className="form-grid" disabled={disabled}>
        <label className="field">
          <span>Фамилия</span>
          <input
            value={values.lastName}
            onChange={(event) => update('lastName', event.target.value)}
            autoComplete="family-name"
            maxLength={255}
          />
        </label>
        <label className="field">
          <span>Имя</span>
          <input
            value={values.firstName}
            onChange={(event) => update('firstName', event.target.value)}
            autoComplete="given-name"
            maxLength={255}
          />
        </label>
        <label className="field">
          <span>Отчество</span>
          <input
            value={values.middleName}
            onChange={(event) => update('middleName', event.target.value)}
            autoComplete="additional-name"
            maxLength={255}
          />
        </label>
        <label className="field">
          <span>Организация</span>
          <input
            value={values.organization}
            onChange={(event) => update('organization', event.target.value)}
            autoComplete="organization"
            maxLength={255}
          />
        </label>
        <label className="field field-wide">
          <span>Должность</span>
          <input
            value={values.position}
            onChange={(event) => update('position', event.target.value)}
            autoComplete="organization-title"
            maxLength={255}
          />
        </label>
      </fieldset>

      <div className="form-actions">
        <button className="button" type="submit" disabled={disabled || submitting}>
          {submitting ? 'Сохранение…' : 'Сохранить изменения'}
        </button>
      </div>
    </form>
  );
}
