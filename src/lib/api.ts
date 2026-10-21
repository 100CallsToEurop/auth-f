export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
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

/** Провайдеры, которые предлагаем, если реестр недоступен. */
export const DEFAULT_PROVIDERS: ProviderInfo[] = [
  { slug: 'authentik', displayName: 'Authentik' },
  { slug: 'yandex', displayName: 'Яндекс' },
  { slug: 'github', displayName: 'GitHub' },
  { slug: 'invision', displayName: 'Invision Community' },
];

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
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

export function getAccessToken(): string | null {
  return accessToken;
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
      return new ApiError(status, message.join(', '));
    }
    if (typeof message === 'string') {
      return new ApiError(status, message);
    }
  }
  return new ApiError(status, `Ошибка запроса (${status})`);
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

async function refreshAccessToken(): Promise<Session | null> {
  try {
    const res = await send('/auth/refresh', { method: 'POST', auth: false });
    const session = await parseBody<Session>(res);
    setAccessToken(session.accessToken);
    return session;
  } catch {
    setAccessToken(null);
    return null;
  }
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
