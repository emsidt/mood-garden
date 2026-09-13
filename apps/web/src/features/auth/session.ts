import { useSyncExternalStore } from 'react';
import axios, { InternalAxiosRequestConfig } from 'axios';
import { api, errorMessage } from '../../lib/api';
export type User = { id: string; email: string; username: string; avatarUrl: string | null; createdAt: string };
type Session = { user: User | null; loading: boolean; error: string | null };
type AuthResponse = { user: User; accessToken: string };
let state: Session = { user: null, loading: true, error: null };
let accessToken: string | null = null;
const listeners = new Set<() => void>();
function publish(next: Session) { state = next; listeners.forEach(fn => fn()); }
export function useSession() {
  return useSyncExternalStore(fn => { listeners.add(fn); return () => { listeners.delete(fn); }; }, () => state);
}
function accept(result: AuthResponse) {
  accessToken = result.accessToken;
  publish({ user: result.user, loading: false, error: null });
}
let refreshPromise: Promise<void> | null = null;
export function restoreSession() {
  if (!refreshPromise) {
    refreshPromise = api.post<AuthResponse>('/auth/refresh')
      .then(({ data }) => accept(data))
      .catch(error => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          accessToken = null;
          publish({ user: null, loading: false, error: null });
        } else {
          publish({ ...state, loading: false, error: errorMessage(error) });
          throw error;
        }
      }).finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}
let bootstrapped = false;
export function bootstrapSession() {
  if (!bootstrapped) { bootstrapped = true; void restoreSession().catch(() => {}); }
}
export async function authenticate(mode: 'login' | 'register', input: { email?: string; identifier?: string; password: string; username?: string }) {
  if (refreshPromise) await refreshPromise;
  const { data } = await api.post<AuthResponse>('/auth/' + mode, input);
  accept(data);
}
export async function logout() {
  if (refreshPromise) await refreshPromise;
  await api.post('/auth/logout');
  accessToken = null;
  publish({ user: null, loading: false, error: null });
}
export function updateSessionUser(user: User) { publish({ ...state, user }); }
api.interceptors.request.use(config => {
  if (accessToken && !config.url?.startsWith('/auth/')) config.headers.Authorization = 'Bearer ' + accessToken;
  return config;
});
api.interceptors.response.use(response => response, async error => {
  const config = error.config as (InternalAxiosRequestConfig & { retried?: boolean }) | undefined;
  if (error.response?.status === 401 && config && !config.retried && !config.url?.startsWith('/auth/')) {
    config.retried = true;
    await restoreSession();
    if (accessToken) { config.headers.Authorization = 'Bearer ' + accessToken; return api(config); }
  }
  return Promise.reject(error);
});
