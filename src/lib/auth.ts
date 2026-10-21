import {
  API_URL,
  ApiError,
  DEFAULT_PROVIDERS,
  apiRequest,
  setAccessToken,
  type ProviderInfo,
  type Session,
  type User,
} from './api';

export function login(email: string, password: string): Promise<Session> {
  return startSession('/auth/login', { email, password });
}

export function register(email: string, password: string): Promise<Session> {
  return startSession('/auth/register', { email, password });
}

export async function refreshSession(): Promise<Session> {
  const session = await apiRequest<Session>('/auth/refresh', { method: 'POST', auth: false });
  setAccessToken(session.accessToken);
  return session;
}

export async function logout(): Promise<void> {
  await apiRequest('/auth/logout', { method: 'POST', auth: false });
  setAccessToken(null);
}

/** Описание активной сессии (устройства) пользователя. */
export interface SessionInfo {
  id: string;
  userAgent: string | null;
  ip: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string;
  current: boolean;
}

export function fetchSessions(): Promise<SessionInfo[]> {
  return apiRequest<SessionInfo[]>('/auth/sessions');
}

/** Отозвать одну сессию (устройство) по id. */
export function revokeSession(id: string): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>(`/auth/sessions/${id}`, { method: 'DELETE' });
}

/**
 * Выход со всех устройств. Если провайдер поддерживает RP-initiated logout
 * (Authentik), возвращает URL выхода из SSO-сессии — по нему нужно перейти.
 */
export async function logoutAll(provider?: string): Promise<string | null> {
  const query = provider ? `?provider=${encodeURIComponent(provider)}` : '';
  const result = await apiRequest<{ logoutUrl?: string | null }>(
    `/auth/logout/all${query}`,
    { method: 'POST' },
  );
  setAccessToken(null);
  return result.logoutUrl ?? null;
}

export function fetchCurrentUser(): Promise<User> {
  return apiRequest<User>('/auth/me');
}

/** URL начала входа через внешний провайдер (полный редирект браузера). */
export function externalAuthUrl(slug: string): string {
  return `${API_URL}/api/auth/external/${slug}`;
}

/**
 * Синхронизация профиля из провайдера: браузер уходит на callback провайдера,
 * backend после подтверждения обновит профиль и вернёт в приложение.
 */
export function externalSyncUrl(slug: string): string {
  return `${API_URL}/api/auth/external/${slug}/sync`;
}

/** Отвязка способа входа от аккаунта. */
export function unlinkProvider(slug: string): Promise<User> {
  return apiRequest<User>(`/auth/external/${slug}`, { method: 'DELETE' });
}

/** Список включённых провайдеров (при недоступности API — дефолтный набор). */
export async function fetchProviders(): Promise<ProviderInfo[]> {
  try {
    const providers = await apiRequest<ProviderInfo[]>('/auth/providers', {
      auth: false,
    });
    return Array.isArray(providers) && providers.length
      ? providers
      : DEFAULT_PROVIDERS;
  } catch {
    return DEFAULT_PROVIDERS;
  }
}

async function startSession(path: string, body: { email: string; password: string }): Promise<Session> {
  const session = await apiRequest<Session>(path, { method: 'POST', body, auth: false });
  if (!session?.accessToken) {
    throw new ApiError(500, 'Сервер не вернул токен доступа');
  }
  setAccessToken(session.accessToken);
  return session;
}
