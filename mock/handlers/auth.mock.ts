import type { MockOptions, SetCookieOption } from 'vite-plugin-mock-dev-server';

import { randomUUID } from 'node:crypto';
import { defineMock } from 'vite-plugin-mock-dev-server';

import { authConfig } from '@/config/auth';

import { adminUser, regularUser } from '../data/users.data';

const sessions = new Map<
  string,
  { userId: string; sessionId: string; remember: boolean; expiresAt: number }
>();
const cookieOptions: SetCookieOption = {
  httpOnly: true,
  path: '/api/auth',
  sameSite: 'lax',
  secure: false,
};
const pendingLogins = new WeakMap<
  object,
  { refresh: string; sessionId: string; userId: string; remember: boolean; expiresAt: number }
>();
const failure = {
  code: 401,
  message: 'Invalid credentials or expired session',
  data: null,
  success: false,
};
function token(userId: string): string {
  return `mock-token-${userId}-${Date.now()}`;
}
function success(data: unknown) {
  return { code: 0, message: 'success', data, success: true };
}
function userFromToken(raw?: string) {
  const match = /^mock-token-([12])-(\d+)$/.exec(raw ?? '');
  if (!match || Date.now() >= Number(match[2]) + 900_000) return null;
  return match[1] === '1' ? adminUser : regularUser;
}
const mocks: MockOptions = [
  {
    url: '/api/auth/login',
    method: 'POST',
    cookies: (req) => {
      const { username, password, remember = false, rememberDays } = req.body;
      const user =
        password === '123456'
          ? username === 'admin'
            ? adminUser
            : username === 'user'
              ? regularUser
              : null
          : null;
      if (!user || (remember && ![7, 15, 30].includes(rememberDays))) return {};
      const previous = req.getCookie(authConfig.refreshCookieName);
      if (previous) sessions.delete(previous);
      const session = {
        refresh: randomUUID(),
        sessionId: randomUUID(),
        userId: user.id,
        remember: remember === true,
        expiresAt: Date.now() + (remember ? rememberDays : 1) * 86400_000,
      };
      sessions.set(session.refresh, session);
      pendingLogins.set(req, session);
      return {
        [authConfig.refreshCookieName]: [
          session.refresh,
          {
            ...cookieOptions,
            ...(session.remember ? { maxAge: session.expiresAt - Date.now() } : {}),
          },
        ],
      };
    },
    body: (req) => {
      const session = pendingLogins.get(req);
      if (!session) return failure;
      pendingLogins.delete(req);
      return success({
        token: token(session.userId),
        expiresIn: 900,
        sessionId: session.sessionId,
        remember: session.remember,
      });
    },
  },
  {
    url: '/api/auth/refresh',
    method: 'POST',
    body: (req) => {
      const key = req.getCookie(authConfig.refreshCookieName) ?? '';
      const session = sessions.get(key);
      if (!session || Date.now() >= session.expiresAt) {
        sessions.delete(key);
        return failure;
      }
      return success({
        token: token(session.userId),
        expiresIn: 900,
        sessionId: session.sessionId,
        remember: session.remember,
      });
    },
  },
  {
    url: '/api/auth/logout',
    method: 'POST',
    body: (req) => {
      sessions.delete(req.getCookie(authConfig.refreshCookieName) ?? '');
      return success(null);
    },
    cookies: { [authConfig.refreshCookieName]: ['', { ...cookieOptions, maxAge: 0 }] },
  },
  {
    url: '/api/auth/info',
    method: 'GET',
    body: (req) => {
      const user = userFromToken(req.headers.authorization?.replace('Bearer ', ''));
      return user ? success(user) : failure;
    },
  },
];
export default defineMock(mocks);
