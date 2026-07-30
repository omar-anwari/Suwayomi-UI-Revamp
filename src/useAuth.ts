import { useSyncExternalStore } from 'react';
import { subscribe, getAccessToken } from './auth';

export function useIsAuthenticated(): boolean {
  return useSyncExternalStore(subscribe, () => getAccessToken() !== null);
}
