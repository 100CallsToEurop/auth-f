export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
  organization: string | null;
  position: string | null;
  phone: string | null;
  /** Телефон подтверждён; до этого редактирование профиля недоступно. */
  phoneVerified: boolean;
  displayName: string | null;
  /** Способы входа, привязанные к аккаунту: 'password', 'authentik', 'yandex', 'github', 'invision'. */
  providers: string[];
}

export interface Session {
  user: User;
  accessToken: string;
}

export interface ProviderInfo {
  slug: string;
  displayName: string;
}

/** Контекст незавершённой привязки SSO к существующему аккаунту. */
export interface AccountLinkInfo {
  provider: string;
  providerName: string;
  email: string;
  /** У аккаунта есть пароль — можно подтвердить владение на форме. */
  hasPassword: boolean;
  expiresAt: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    /** Тело ответа: в нём бывают машинно-читаемые флаги (canAttachPassword). */
    readonly body: unknown = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const rawApiUrl =
  import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL || 'http://localhost:3000';

export const API_URL = rawApiUrl.replace(/\/+$/, '');

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
}

function toApiError(status: number, data: unknown): ApiError {
  if (data && typeof data === 'object' && 'message' in data) {
    const { message } = data as { message: unknown };
    if (Array.isArray(message)) {
      return new ApiError(status, message.join(', '), data);
    }
    if (typeof message === 'string') {
      return new ApiError(status, message, data);
    }
  }
  return new ApiError(status, `Ошибка запроса (${status})`, data);
}

async function parseBody<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: unknown;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new ApiError(res.status, 'Некорректный ответ сервера');
    }
  }
  if (!res.ok) {
    throw toApiError(res.status, data);
  }
  return data as T;
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const { method = 'GET', body, auth = true } = options;
  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (auth && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  try {
    return await fetch(`${API_URL}/api${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Не удалось связаться с сервером');
  }
}

/**
 * Обновление access-токена. Запрос выполняется один раз: параллельные
 * вызовы (несколько запросов одновременно получили 401) ждут один и тот же
 * промис. Иначе второй ответ затирал бы токен, установленный первым.
 */
let refreshPromise: Promise<Session | null> | null = null;

export function refreshAccessToken(): Promise<Session | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await send('/auth/refresh', { method: 'POST', auth: false });
        const session = await parseBody<Session>(res);
        setAccessToken(session.accessToken);
        return session;
      } catch {
        setAccessToken(null);
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await send(path, options);
  if (res.status === 401 && options.auth !== false) {
    const session = await refreshAccessToken();
    if (session) {
      return parseBody<T>(await send(path, options));
    }
  }
  return parseBody<T>(res);
}

/**
 * Проверка URL, полученного от сервера, перед переходом: допускаются только
 * http(s)-адреса. Иначе значение из ответа сервера (например, logoutUrl)
 * могло бы превратиться в javascript:-редирект.
 */
export function isSafeRedirect(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
