import type { User } from './api';

/** Отображаемое имя: displayName → «Имя Фамилия» → email. */
export function displayName(user: User): string {
  if (user.displayName) {
    return user.displayName;
  }
  const composed = [user.firstName, user.lastName].filter(Boolean).join(' ');
  return composed || user.email;
}

/** Инициалы для аватара. */
export function initials(user: User): string {
  const name = displayName(user).trim();
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
