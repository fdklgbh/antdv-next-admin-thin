export const authConfig = {
  refreshCookieName: 'refresh_token',
  sessionHintKey: import.meta.env.VITE_AUTH_SESSION_HINT_KEY || 'has_session',
} as const;
