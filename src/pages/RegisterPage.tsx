import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';
import { ProviderButtons } from '../components/ProviderButtons';

/** Флаг из ответа 409: аккаунт создан через провайдера, пароль можно привязать. */
function offersPasswordAttachment(error: ApiError): boolean {
  if (error.status !== 409 || !error.body || typeof error.body !== 'object') {
    return false;
  }
  return (
    (error.body as { canAttachPassword?: unknown }).canAttachPassword === true
  );
}

export function RegisterPage() {
  const { register, attachPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [canAttachPassword, setCanAttachPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [attaching, setAttaching] = useState(false);

  const validate = (): boolean => {
    if (!email.trim()) {
      setError('Укажите email');
      return false;
    }
    if (password.length < 8) {
      setError('Пароль должен быть не менее 8 символов');
      return false;
    }
    if (password !== confirmation) {
      setError('Пароли не совпадают');
      return false;
    }
    return true;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }
    setError(null);
    setCanAttachPassword(false);
    setSubmitting(true);
    try {
      await register(email.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setCanAttachPassword(offersPasswordAttachment(err));
        return;
      }
      setError('Не удалось зарегистрироваться');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAttachPassword = async () => {
    if (!validate()) {
      return;
    }
    setError(null);
    setAttaching(true);
    try {
      await attachPassword(email.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Не удалось привязать пароль к аккаунту',
      );
    } finally {
      setAttaching(false);
    }
  };

  return (
    <div className="page">
      <form className="card" onSubmit={(event) => void handleSubmit(event)}>
        <h1>Регистрация</h1>
        {error && <div className="error" role="alert">{error}</div>}
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setCanAttachPassword(false);
            }}
            autoComplete="email"
            required
          />
        </label>
        <label className="field">
          <span>Пароль</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
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
          {submitting ? 'Создание аккаунта…' : 'Зарегистрироваться'}
        </button>
        {canAttachPassword && (
          <div className="notice" role="status">
            <span>
              Аккаунт с этой почтой уже существует и создан через внешний вход.
              Пароль можно привязать к нему и сразу войти.
            </span>
            <span className="muted small">
              Почта не подтверждается. Продолжайте, только если это ваш аккаунт.
            </span>
            <button
              type="button"
              className="button secondary"
              onClick={() => void handleAttachPassword()}
              disabled={attaching}
            >
              {attaching ? 'Привязка…' : 'Привязать пароль и войти'}
            </button>
          </div>
        )}
        <ProviderButtons title="Продолжить через" />
        <p className="hint">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </form>
    </div>
  );
}
