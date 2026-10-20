import { API_URL, ApiError, apiRequest, setAccessToken, type Session, type User } from './api';

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

export function fetchCurrentUser(): Promise<User> {
  return apiRequest<User>('/auth/me');
}

export const oidcAuthentikUrl = `${API_URL}/api/auth/oidc/authentik`;

async function startSession(path: string, body: { email: string; password: string }): Promise<Session> {
  const session = await apiRequest<Session>(path, { method: 'POST', body, auth: false });
  if (!session?.accessToken) {
    throw new ApiError(500, 'Сервер не вернул токен доступа');
  }
  setAccessToken(session.accessToken);
  return session;
}
