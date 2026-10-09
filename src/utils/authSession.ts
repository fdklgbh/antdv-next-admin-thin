export const AUTH_SESSION_KEY = 'auth_session_v1';

export function resolveLoginRedirectTarget(redirect: unknown): string {
  if (
    typeof redirect === 'string' &&
    redirect.startsWith('/') &&
    !redirect.startsWith('//') &&
    !redirect.includes('\\') &&
    [...redirect].every((character) => character.charCodeAt(0) >= 32) &&
    !/^\/login\/?(?:[?#]|$)/i.test(redirect)
  )
    return redirect;
  return '/';
}

export interface AuthSession {
  version: string;
  status: 'active' | 'anonymous' | 'changing';
  token: string | null;
  expiresAt: number;
  sessionId: string | null;
  remember: boolean;
}

export class SessionChangedError extends Error {
  constructor() {
    super('登录会话已变化，请重新操作');
  }
}

export function readAuthSession(): AuthSession | null {
  if (typeof localStorage === 'undefined' || typeof sessionStorage === 'undefined') return null;
  return readStoredSession(
    localStorage.getItem(AUTH_SESSION_KEY) ?? sessionStorage.getItem(AUTH_SESSION_KEY),
  );
}

function readStoredSession(raw: string | null): AuthSession | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return null;
    const record = value as Record<string, unknown>;
    if (
      typeof record.version !== 'string' ||
      !['active', 'anonymous', 'changing'].includes(String(record.status)) ||
      !(record.token === null || typeof record.token === 'string') ||
      !(record.sessionId === null || typeof record.sessionId === 'string') ||
      typeof record.expiresAt !== 'number' ||
      !Number.isFinite(record.expiresAt) ||
      typeof record.remember !== 'boolean'
    )
      return null;
    return record as unknown as AuthSession;
  } catch {
    return null;
  }
}

export function sessionVersion(): string {
  return remoteSessionVersion ?? readAuthSession()?.version ?? 'initial';
}

export function assertSessionVersion(version: string): void {
  if (version !== sessionVersion()) throw new SessionChangedError();
}

export function newSessionVersion(): string {
  return Array.from(crypto.getRandomValues(new Uint32Array(4)), (n) => n.toString(16)).join('-');
}

let pageVersion: string | undefined;
let remoteSessionVersion: string | undefined;
const sessionListeners = new Set<() => void>();
const sessionChannel =
  typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('auth-session');

sessionChannel?.addEventListener('message', (event: MessageEvent<unknown>) => {
  if (typeof event.data !== 'string') return;
  remoteSessionVersion = event.data;
  sessionListeners.forEach((listener) => listener());
});

export function subscribeToSessionChanges(listener: () => void): () => void {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}

export function pageSessionVersion(): string {
  pageVersion ??= sessionVersion();
  return pageVersion;
}

export function writeAuthSession(session: AuthSession): void {
  if (session.status === 'anonymous') {
    const hadActiveSession = readAuthSession()?.status === 'active';
    localStorage.removeItem(AUTH_SESSION_KEY);
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    pageVersion = session.version;
    remoteSessionVersion = session.version;
    if (hadActiveSession) sessionChannel?.postMessage(session.version);
    return;
  }

  const serialized = JSON.stringify(session);
  if (session.remember) {
    localStorage.setItem(AUTH_SESSION_KEY, serialized);
    sessionStorage.removeItem(AUTH_SESSION_KEY);
  } else {
    sessionStorage.setItem(AUTH_SESSION_KEY, serialized);
    localStorage.removeItem(AUTH_SESSION_KEY);
  }
  pageVersion = session.version;
  remoteSessionVersion = session.version;
  if (session.status === 'active') sessionChannel?.postMessage(session.version);
}

export function clearTransientAuthSession(): void {
  if (typeof localStorage !== 'undefined') {
    const persisted = readStoredSession(localStorage.getItem(AUTH_SESSION_KEY));
    if (!persisted?.remember) localStorage.removeItem(AUTH_SESSION_KEY);
  }
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
  }
}
