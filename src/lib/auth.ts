import {
  API_URL,
  ApiError,
  apiRequest,
  refreshAccessToken,
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
  const session = await refreshAccessToken();
  if (!session) {
    throw new ApiError(401, 'Сессия истекла');
  }
  return session;
}

/**
 * Выход из текущей сессии. Возвращает URL выхода из SSO-провайдера, если
 * текущая сессия была открыта через него, — по нему нужно перейти.
 */
export async function logout(): Promise<string | null> {
  const result = await apiRequest<{ logoutUrl?: string | null }>('/auth/logout', {
    method: 'POST',
    auth: false,
  });
  setAccessToken(null);
  return result.logoutUrl ?? null;
}

/** Описание активной сессии (устройства) пользователя. */
export interface SessionInfo {
  id: string;
  userAgent: string | null;
  /** Человекочитаемое устройство, напр. «Chrome · macOS». */
  device: string;
  ip: string | null;
  createdAt: string;
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

/** Завершить все другие сессии, оставив текущую. */
export function revokeOtherSessions(): Promise<{ ok: true; revoked: number }> {
  return apiRequest<{ ok: true; revoked: number }>(
    '/auth/sessions/revoke-others',
    { method: 'POST' },
  );
}

/**
 * Выход со всех устройств. Если текущая сессия открыта через SSO-провайдер
 * (Authentik), возвращает URL выхода из его SSO-сессии — по нему нужно перейти.
 */
export async function logoutAll(): Promise<string | null> {
  const result = await apiRequest<{ logoutUrl?: string | null }>(
    '/auth/logout/all',
    { method: 'POST' },
  );
  setAccessToken(null);
  return result.logoutUrl ?? null;
}

export function fetchCurrentUser(): Promise<User> {
  return apiRequest<User>('/auth/me');
}

/**
 * URL отдельного входа через конкретного провайдера. Callback отвечает JSON
 * с accessToken, поэтому ссылку открываем в новой вкладке: приложение
 * остаётся на месте, а refresh-cookie устанавливается для API.
 */
export function providerAuthUrl(slug: string): string {
  return `${API_URL}/api/auth/${slug}`;
}

/**
 * Синхронизация профиля из провайдера: браузер уходит на callback провайдера,
 * backend после подтверждения обновит профиль и вернёт в приложение.
 *
 * Запрос отправляется POST-формой: состояние меняется, а refresh-cookie
 * на кросс-сайтовом POST не отправляется (SameSite=Lax).
 */
export function providerSyncUrl(slug: string): string {
  return `${API_URL}/api/auth/${slug}/sync`;
}

/**
 * Явная привязка провайдера к текущему аккаунту (из профиля). Тоже POST.
 */
export function providerLinkUrl(slug: string): string {
  return `${API_URL}/api/auth/${slug}/link`;
}

/** Отвязка способа входа от аккаунта. */
export function unlinkProvider(slug: string): Promise<User> {
  return apiRequest<User>(`/auth/${slug}`, { method: 'DELETE' });
}

/**
 * Список внешних провайдеров. Если API недоступен — возвращаем пустой
 * список, чтобы страница входа не падала.
 */
export async function fetchProviders(): Promise<ProviderInfo[]> {
  try {
    const providers = await apiRequest<ProviderInfo[]>('/auth/providers', {
      auth: false,
    });
    return Array.isArray(providers) ? providers : [];
  } catch {
    return [];
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
