import {
  create as createAxiosInstance,
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import { $t } from '@/locales';
import router from '@/router';
import { useAuthStore } from '@/stores/auth';
import { showApiError } from '@/utils/apiError';
import {
  pageSessionVersion,
  assertSessionVersion,
  readAuthSession,
  SessionChangedError,
} from '@/utils/authSession';
import { clearSessionState } from '@/utils/session';

export interface RequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean;
  sessionVersion?: string;
  skipErrorMessage?: boolean;
  skipAuthRefresh?: boolean;
  skipRedirect?: boolean;
}

type RetriableRequestConfig = InternalAxiosRequestConfig &
  RequestConfig & {
    _retry?: boolean;
  };

export const service: AxiosInstance = createAxiosInstance({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

service.interceptors.request.use(
  (config) => {
    const requestConfig = config as RequestConfig;
    const authStore = useAuthStore();

    if (!requestConfig.skipAuth) {
      if (requestConfig.sessionVersion !== undefined)
        assertSessionVersion(requestConfig.sessionVersion);
      assertSessionVersion(pageSessionVersion());
      requestConfig.sessionVersion = pageSessionVersion();
      const snapshot = readAuthSession();
      if (snapshot?.status === 'changing' || snapshot?.status === 'anonymous')
        throw new SessionChangedError();
      const currentToken = snapshot?.token ?? authStore.token;
      if (currentToken) config.headers.Authorization = `Bearer ${currentToken}`;
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('Request error:', error);
    if (!(error.config as RequestConfig | undefined)?.skipErrorMessage) {
      showApiError(error, $t('apiErrors.sendFailed'));
    }
    return Promise.reject(error);
  },
);

// Normalize business-level 401 responses before the shared error interceptor.
service.interceptors.response.use((response: AxiosResponse) => {
  const config = response.config as RequestConfig;
  if (!config.skipAuth && config.sessionVersion !== undefined)
    assertSessionVersion(config.sessionVersion);
  if (response.data?.code === 401) {
    throw new AxiosError(
      response.data.message || 'Unauthorized',
      AxiosError.ERR_BAD_REQUEST,
      response.config,
      response.request,
      response,
    );
  }
  return response;
});

function expireSession(config: RequestConfig, error: unknown): void {
  const currentRoute = router.currentRoute?.value;
  clearSessionState(router);
  if (!config.skipErrorMessage) showApiError(error, $t('apiErrors.sessionExpired'));
  if (!config.skipRedirect) {
    void router.push(
      currentRoute && currentRoute.path !== '/login'
        ? { path: '/login', query: { redirect: currentRoute.fullPath } }
        : '/login',
    );
  }
}

service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data;
    const requestConfig = response.config as RequestConfig;

    if (res.code !== undefined && res.code !== 0 && res.code !== 200) {
      const error = new AxiosError(
        res.message || $t('apiErrors.requestFailed'),
        AxiosError.ERR_BAD_RESPONSE,
        response.config,
        response.request,
        response,
      );
      if (!requestConfig.skipErrorMessage) showApiError(error);
      return Promise.reject(error);
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    // 下载失败时，JSON 错误响应仍可能被 Axios 包装成 Blob。
    if (
      error.response?.data instanceof Blob &&
      error.response.data.type.includes('application/json')
    ) {
      try {
        error.response.data = JSON.parse(await error.response.data.text());
      } catch (parseError) {
        console.error('Failed to parse download error response:', parseError);
      }
    }

    if (!originalRequest?.skipAuth && originalRequest?.sessionVersion !== undefined) {
      assertSessionVersion(originalRequest.sessionVersion);
    }
    if (
      (error.response?.status === 401 ||
        (error.response?.data as { code?: number } | undefined)?.code === 401) &&
      originalRequest
    ) {
      // Login failures and the refresh endpoint must never recursively renew a session.
      if (originalRequest.skipAuth || originalRequest.skipAuthRefresh) {
        return Promise.reject(error);
      }
      if (originalRequest._retry) {
        expireSession(originalRequest, error);
        return Promise.reject(error);
      }
      originalRequest._retry = true;

      try {
        const authStore = useAuthStore();
        // A concurrent request may already have replaced the token used by this request.
        const currentSession = readAuthSession();
        const currentToken = currentSession?.token ?? authStore.token;
        const tokenIsFresh = !currentSession || currentSession.expiresAt > Date.now();
        const newToken =
          tokenIsFresh &&
          currentToken &&
          originalRequest.headers.Authorization !== `Bearer ${currentToken}`
            ? currentToken
            : await authStore.refreshToken();

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }

        return service(originalRequest);
      } catch (refreshError) {
        if (originalRequest.sessionVersion !== undefined)
          assertSessionVersion(originalRequest.sessionVersion);
        if (isUnauthorized(refreshError)) expireSession(originalRequest, refreshError);
        else if (!originalRequest.skipErrorMessage)
          showApiError(refreshError, $t('apiErrors.refreshFailed'));
        return Promise.reject(refreshError);
      }
    }

    console.error('Response error:', error);

    if (!originalRequest?.skipErrorMessage) showApiError(error);
    if (!originalRequest?.skipRedirect) {
      if (error.response?.status === 403) void router.push('/403');
      if (error.response?.status === 500) void router.push('/500');
    }

    return Promise.reject(error);
  },
);

export const request = {
  get<T = unknown>(url: string, config?: RequestConfig): Promise<T> {
    return service.get<T>(url, config).then((response) => response.data);
  },

  post<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return service.post<T>(url, data, config).then((response) => response.data);
  },

  put<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return service.put<T>(url, data, config).then((response) => response.data);
  },

  delete<T = unknown>(url: string, config?: RequestConfig): Promise<T> {
    return service.delete<T>(url, config).then((response) => response.data);
  },

  patch<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return service.patch<T>(url, data, config).then((response) => response.data);
  },
};

export default service;

export function isUnauthorized(error: unknown): boolean {
  if (!(error instanceof AxiosError)) return false;
  return (
    error.response?.status === 401 ||
    (error.response?.data as { code?: number } | undefined)?.code === 401
  );
}
