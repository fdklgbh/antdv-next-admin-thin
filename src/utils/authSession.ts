export const AUTH_SESSION_KEY = 'auth_session_v1';

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
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(AUTH_SESSION_KEY);
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
  return readAuthSession()?.version ?? 'initial';
}

export function assertSessionVersion(version: string): void {
  if (version !== sessionVersion()) throw new SessionChangedError();
}

export function newSessionVersion(): string {
  return Array.from(crypto.getRandomValues(new Uint32Array(4)), (n) => n.toString(16)).join('-');
}

let pageVersion: string | undefined;

export function pageSessionVersion(): string {
  pageVersion ??= sessionVersion();
  return pageVersion;
}

export function writeAuthSession(session: AuthSession): void {
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  pageVersion = session.version;
}
