import type { User } from './api';

/** Отображаемое имя: «Фамилия Имя Отчество» → displayName → email. */
export function displayName(user: User): string {
  const composed = [user.lastName, user.firstName, user.middleName]
    .filter(Boolean)
    .join(' ');
  return composed || user.displayName || user.email;
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
