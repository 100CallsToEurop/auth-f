import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError, type AccountLinkInfo } from '../lib/api';
import {
  clearAccountLinkToken,
  fetchAccountLinkInfo,
  getAccountLinkToken,
} from '../lib/auth';

/**
 * Промежуточный экран после входа через провайдера, когда его email совпал с
 * уже существующим аккаунтом. Вход не выполняется: сначала нужно доказать
 * владение аккаунтом паролем. Только после этого backend привязывает
 * SSO-идентичность и открывает сессию.
 */
type PageState =
  | { kind: 'loading' }
  | { kind: 'ready'; info: AccountLinkInfo }
  | { kind: 'expired'; message: string }
  | { kind: 'no-token' };

const EXPIRED_TEXT =
  'Ссылка подтверждения устарела или уже использована. Начните вход через провайдера заново.';

export function AccountLinkPage() {
  const { confirmAccountLink: confirmLink } = useAuth();
  const navigate = useNavigate();
  const [token] = useState(() => getAccountLinkToken());
  const [state, setState] = useState<PageState>(
    token ? { kind: 'loading' } : { kind: 'no-token' },
  );
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;
    void fetchAccountLinkInfo(token)
      .then((info) => {
        if (!cancelled) {
          setState({ kind: 'ready', info });
        }
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }
        setState({
          kind: 'expired',
          message: err instanceof ApiError ? err.message : EXPIRED_TEXT,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) {
      return;
    }
    if (!password) {
      setError('Введите пароль');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await confirmLink(token, password);
      // Токен одноразовый и уже израсходован — в памяти он больше не нужен.
      clearAccountLinkToken();
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        clearAccountLinkToken();
        setState({ kind: 'expired', message: err.message });
        return;
      }
      setError(
        err instanceof ApiError
          ? err.message
          : 'Не удалось подтвердить владение аккаунтом',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (state.kind === 'loading') {
    return (
      <div className="page">
        <div className="spinner" role="status" aria-live="polite" aria-label="Загрузка" />
      </div>
    );
  }

  if (state.kind === 'no-token' || state.kind === 'expired') {
    return (
      <div className="page">
        <div className="card">
          <h1>Не удалось привязать вход</h1>
          <div className="error" role="alert">
            {state.kind === 'expired' ? state.message : EXPIRED_TEXT}
          </div>
          <p className="hint">
            <Link to="/login">Вернуться ко входу</Link>
          </p>
        </div>
      </div>
    );
  }

  const { info } = state;

  return (
    <div className="page">
      <div className="card">
        <h1>Привязка входа</h1>
        <p className="notice">
          <span>
            Найден существующий аккаунт с этим email. Чтобы привязать SSO-вход,
            подтвердите владение аккаунтом.
          </span>
          <span className="muted small">
            {info.email} · {info.providerName}
          </span>
        </p>

        {info.hasPassword ? (
          <form
            className="card-form"
            onSubmit={(event) => void handleSubmit(event)}
          >
            {error && (
              <div className="error" role="alert">
                {error}
              </div>
            )}
            <label className="field">
              <span>Пароль от аккаунта {info.email}</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                autoFocus
                required
              />
            </label>
            <button className="button" type="submit" disabled={submitting}>
              {submitting ? 'Проверка…' : 'Подтвердить и привязать'}
            </button>
          </form>
        ) : (
          <div className="notice">
            <span>
              У этого аккаунта нет пароля. Войдите способом, который уже привязан
              к аккаунту, и привяжите {info.providerName} в настройках профиля.
            </span>
          </div>
        )}

        <p className="hint">
          Это не ваш аккаунт? <Link to="/login">Вернуться ко входу</Link>
        </p>
      </div>
    </div>
  );
}
