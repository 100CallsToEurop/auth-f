import { useOutletContext } from 'react-router-dom';
import type { ProviderInfo, User } from '../lib/api';

export interface ProfileOutletContext {
  user: User;
  providers: ProviderInfo[];
  updateUser: (user: User) => void;
  reportError: (message: string) => void;
}

/** Данные профиля, загруженные один раз в общем layout'е. */
export function useProfileOutlet(): ProfileOutletContext {
  return useOutletContext<ProfileOutletContext>();
}
