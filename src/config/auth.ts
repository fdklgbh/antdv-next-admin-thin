export const authConfig = {
  refreshCookieName: 'refresh_token',
  rememberSessionMaxAgeMs: 7 * 24 * 60 * 60 * 1000,
  sessionHintKey: import.meta.env.VITE_AUTH_SESSION_HINT_KEY || 'has_session',
} as const;
