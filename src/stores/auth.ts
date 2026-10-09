import type { User, Role, Permission, LoginResult, RememberDays } from '@/types/auth';

import { defineStore } from 'pinia';
import { ref, computed, onScopeDispose } from 'vue';

import avatarImg from '@/assets/images/avatar-256.png';
import { authConfig } from '@/config/auth';
import { ALL_PERMISSION } from '@/constants/permissions';
import {
  AUTH_SESSION_KEY,
  readAuthSession,
  writeAuthSession,
  sessionVersion,
  pageSessionVersion,
  assertSessionVersion,
  newSessionVersion,
  subscribeToSessionChanges,
  SessionChangedError,
  type AuthSession,
} from '@/utils/authSession';

export const useAuthStore = defineStore('auth', () => {
  const initial = readAuthSession();
  let observedVersion = pageSessionVersion();
  const token = ref<string | null>(initial?.token ?? null);
  const tokenExpiresAt = ref<number | null>(initial?.expiresAt ?? null);
  const rememberSession = ref(initial?.remember ?? false);
  const user = ref<User | null>(null);
  const roles = ref<Role[]>([]);
  const permissions = ref<Permission[]>([]);
  const status = ref(initial?.status);
  let refreshPromise: Promise<string> | null = null;
  let restorePromise: Promise<boolean> | null = null;

  // 旧版分散存储不再参与认证，首次访问通过 HttpOnly Cookie 恢复。
  for (const storage of [localStorage, sessionStorage]) {
    for (const key of [
      'access_token',
      'token_expires_at',
      'user_info',
      'user_data_version',
      authConfig.sessionHintKey,
    ]) {
      storage.removeItem(key);
    }
  }

  const hasSessionHint = computed(() => status.value === 'active');
  const canAttemptRefresh = computed(
    () => status.value !== 'anonymous' && status.value !== 'changing',
  );
  const isTokenExpired = computed(() => !token.value || Date.now() >= (tokenExpiresAt.value ?? 0));
  const isLoggedIn = computed(() => !!token.value && !!user.value && !isTokenExpired.value);
  const userRoles = computed(() => roles.value.map((role) => role.code));
  const userPermissions = computed(() => permissions.value.map((permission) => permission.code));

  function apply(session: AuthSession): void {
    observedVersion = session.version;
    token.value = session.token;
    tokenExpiresAt.value = session.expiresAt;
    rememberSession.value = session.remember;
    status.value = session.status;
  }

  function publish(session: AuthSession): void {
    writeAuthSession(session);
    apply(session);
  }

  function syncSession(): void {
    if (sessionVersion() !== observedVersion) {
      token.value = null;
      setUserInfo(null);
      window.location.reload();
      return;
    }
    const session = readAuthSession();
    if (session) apply(session);
  }

  function onStorage(event: StorageEvent): void {
    if (event.key === AUTH_SESSION_KEY || event.key === null) syncSession();
  }
  function onVisible(): void {
    if (document.visibilityState === 'visible') syncSession();
  }
  window.addEventListener('storage', onStorage);
  const unsubscribeSessionChanges = subscribeToSessionChanges(syncSession);
  window.addEventListener('pageshow', syncSession);
  document.addEventListener('visibilitychange', onVisible);
  onScopeDispose(() => {
    window.removeEventListener('storage', onStorage);
    unsubscribeSessionChanges();
    window.removeEventListener('pageshow', syncSession);
    document.removeEventListener('visibilitychange', onVisible);
  });

  function setUserInfo(value: User | null): void {
    user.value = value ? { ...value, avatar: value.avatar || avatarImg } : null;
    roles.value = value?.roles ?? [];
    permissions.value = value?.permissions ?? [];
  }

  function clearLocalSession(): void {
    localStorage.removeItem('app-tabs-state');
    publish({
      version: newSessionVersion(),
      status: 'anonymous',
      token: null,
      expiresAt: 0,
      sessionId: null,
      remember: rememberSession.value,
    });
    setUserInfo(null);
  }

  function accept(result: LoginResult, version: string): void {
    assertSessionVersion(version);
    const current = readAuthSession();
    if (current?.sessionId && current.sessionId !== result.sessionId) {
      localStorage.removeItem('app-tabs-state');
      publish({
        version: newSessionVersion(), status: 'active', token: result.token,
        expiresAt: Date.now() + result.expiresIn * 1000,
        sessionId: result.sessionId, remember: result.remember,
      });
      setUserInfo(null);
      window.location.reload();
      throw new SessionChangedError();
    }
    publish({
      version,
      status: 'active',
      token: result.token,
      expiresAt: Date.now() + result.expiresIn * 1000,
      sessionId: result.sessionId,
      remember: result.remember,
    });
  }

  async function login(
    username: string,
    password: string,
    remember = false,
    rememberDays: RememberDays = 7,
  ): Promise<void> {
    const { login: loginApi, getUserInfo } = await import('@/api/auth');
    const version = newSessionVersion();
    localStorage.removeItem('app-tabs-state');
    publish({ version, status: 'changing', token: null, expiresAt: 0, sessionId: null, remember });
    setUserInfo(null);
    try {
      const result = await loginApi({
        username,
        password,
        remember,
        rememberDays: remember ? rememberDays : undefined,
      });
      assertSessionVersion(version);
      // 完成登录也发布新版本，使等待登录完成的其他标签页重新加载。
      const completedVersion = newSessionVersion();
      publish({
        version: completedVersion,
        status: 'active',
        token: result.data.token,
        expiresAt: Date.now() + result.data.expiresIn * 1000,
        sessionId: result.data.sessionId,
        remember: result.data.remember,
      });
      const info = await getUserInfo({ sessionVersion: completedVersion });
      assertSessionVersion(completedVersion);
      setUserInfo(info.data);
    } catch (error) {
      if (sessionVersion() === version) clearLocalSession();
      throw error;
    }
  }

  async function logout(): Promise<void> {
    const version = observedVersion;
    assertSessionVersion(version);
    const { logout: logoutApi } = await import('@/api/auth');
    assertSessionVersion(version);
    await logoutApi();
    assertSessionVersion(version);
    clearLocalSession();
  }

  function refreshToken(): Promise<string> {
    if (refreshPromise) return refreshPromise;
    const version = sessionVersion();
    refreshPromise = (async () => {
      assertSessionVersion(observedVersion);
      const current = readAuthSession();
      if (current?.status === 'anonymous' || current?.status === 'changing')
        throw new SessionChangedError();
      if (current?.token && current.token !== token.value && current.expiresAt > Date.now()) {
        apply(current);
        return current.token;
      }
      const { refreshToken: refreshApi } = await import('@/api/auth');
      const result = await refreshApi();
      accept(result.data, version);
      return result.data.token;
    })().finally(() => {
      refreshPromise = null;
    });
    return refreshPromise;
  }

  const hasRole = (role: string): boolean => {
    return userRoles.value.includes(role);
  };

  const hasAnyRole = (roleList: string[]): boolean => {
    return roleList.some((role) => hasRole(role));
  };

  const hasAllRoles = (roleList: string[]): boolean => {
    return roleList.every((role) => hasRole(role));
  };

  const hasPermission = (permission: string): boolean => {
    return (
      userPermissions.value.includes(ALL_PERMISSION) || userPermissions.value.includes(permission)
    );
  };

  const hasAnyPermission = (permissionList: string[]): boolean => {
    return permissionList.some((perm) => hasPermission(perm));
  };

  const hasAllPermissions = (permissionList: string[]): boolean => {
    return permissionList.every((perm) => hasPermission(perm));
  };

  function initAuth(): void {
    syncSession();
  }

  function restoreSession(): Promise<boolean> {
    if (restorePromise) return restorePromise;
    const version = observedVersion;
    restorePromise = (async () => {
      assertSessionVersion(version);
      const current = readAuthSession();
      if (current) apply(current);
      if (!canAttemptRefresh.value) return false;
      if (!token.value || Date.now() >= (tokenExpiresAt.value ?? 0)) await refreshToken();
      if (!user.value) {
        const { getUserInfo } = await import('@/api/auth');
        const result = await getUserInfo({ skipErrorMessage: true, skipRedirect: true });
        assertSessionVersion(version);
        setUserInfo(result.data);
      }
      return !!token.value && !!user.value;
    })().finally(() => {
      restorePromise = null;
    });
    return restorePromise;
  }

  return {
    rememberSession,
    token,
    hasSessionHint,
    tokenExpiresAt,
    user,
    roles,
    permissions,
    isTokenExpired,
    isLoggedIn,
    canAttemptRefresh,
    userRoles,
    userPermissions,
    setUserInfo,
    clearLocalSession,
    login,
    logout,
    refreshToken,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    initAuth,
    restoreSession,
  };
});
