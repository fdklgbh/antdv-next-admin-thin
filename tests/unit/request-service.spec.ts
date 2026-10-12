import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { clearSessionState, messageError, push, refreshToken } = vi.hoisted(() => ({
  clearSessionState: vi.fn(),
  messageError: vi.fn(),
  push: vi.fn(),
  refreshToken: vi.fn(),
}));

vi.mock('antdv-next', () => ({
  message: {
    error: messageError,
  },
}));

vi.mock('@/router', () => ({
  default: {
    push,
  },
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    refreshToken,
    token: null,
  }),
}));

vi.mock('@/utils/session', () => ({
  clearSessionState,
}));

import { $t } from '@/locales';
import { showApiError } from '@/utils/apiError';
import { service, type RequestConfig } from '@/utils/request';

const originalAdapter = service.defaults.adapter;

function httpError(
  status: number,
  code: number,
  config: InternalAxiosRequestConfig = { headers: new AxiosHeaders() },
  message = '请求失败',
): AxiosError {
  return new AxiosError('request failed', AxiosError.ERR_BAD_RESPONSE, config, undefined, {
    status,
    statusText: '',
    headers: {},
    config,
    data: { code, message, data: null },
  });
}

/** Adapter that throws the provided error so the exact object can be asserted upstream. */
function failingAdapter(error: AxiosError) {
  return async (config: InternalAxiosRequestConfig) => {
    error.config = config;
    if (error.response) error.response.config = config;
    throw error;
  };
}

describe('request service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    service.defaults.adapter = async (config) => {
      throw httpError(401, 20001, config);
    };
  });

  afterEach(() => {
    service.defaults.adapter = originalAdapter;
  });

  it('exports the axios instance used by request helpers', () => {
    expect(service.defaults.timeout).toBe(15000);
    expect(service.defaults.headers['Content-Type']).toBe('application/json');
  });

  it.each([
    ['network failure', new AxiosError('network unavailable', AxiosError.ERR_NETWORK)],
    ['timeout', new AxiosError('request timed out', AxiosError.ECONNABORTED)],
    ['service unavailable', httpError(503, 20003)],
    ['unexpected failure', new Error('refresh failed')],
  ])('preserves the session when token refresh fails with %s', async (_name, refreshError) => {
    refreshToken.mockRejectedValueOnce(refreshError);

    await expect(service.get('/protected', { skipErrorMessage: true })).rejects.toBe(refreshError);

    expect(refreshToken).toHaveBeenCalledOnce();
    expect(clearSessionState).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it.each([
    ['HTTP 401', httpError(401, 20001)],
    ['legacy business 401', httpError(200, 401)],
  ])('clears the complete session when token refresh returns %s', async (_name, refreshError) => {
    refreshToken.mockRejectedValueOnce(refreshError);

    await expect(service.get('/protected', { skipErrorMessage: true })).rejects.toBe(refreshError);

    expect(refreshToken).toHaveBeenCalledOnce();
    expect(clearSessionState).toHaveBeenCalledOnce();
    expect(push).toHaveBeenCalledExactlyOnceWith('/login');
  });
});

describe('request service: HTTP 403 must not redirect to /403', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    service.defaults.adapter = originalAdapter;
  });

  it('shows the business 20002 text, keeps the session and propagates the original error', async () => {
    const error = httpError(403, 20002);
    service.defaults.adapter = failingAdapter(error);

    await expect(service.get('/role/delete')).rejects.toBe(error);

    expect(messageError).toHaveBeenCalledExactlyOnceWith($t('apiErrors.codes.20002'));
    expect(refreshToken).not.toHaveBeenCalled();
    expect(clearSessionState).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalledWith('/403');
    expect(push).not.toHaveBeenCalledWith({ path: '/403' });
  });

  it.each([
    ['backend message', 90001, '自定义业务错误', '自定义业务错误'],
    ['HTTP 403 fallback text', 90001, '', $t('apiErrors.http.403')],
  ])(
    'shows %s for an unmapped 403 business code without redirecting',
    async (_name, code, message, expected) => {
      const error = httpError(403, code, { headers: new AxiosHeaders() }, message);
      service.defaults.adapter = failingAdapter(error);

      await expect(service.get('/other')).rejects.toBe(error);

      expect(messageError).toHaveBeenCalledExactlyOnceWith(expected);
      expect(push).not.toHaveBeenCalled();
      expect(push).not.toHaveBeenCalledWith('/403');
      expect(push).not.toHaveBeenCalledWith({ path: '/403' });
    },
  );

  it('keeps the existing redirect to /500 for HTTP 500', async () => {
    const error = httpError(500, 10004);
    service.defaults.adapter = failingAdapter(error);

    await expect(service.get('/server-error')).rejects.toBe(error);

    expect(messageError).toHaveBeenCalledExactlyOnceWith($t('apiErrors.codes.10004'));
    expect(push).toHaveBeenCalledExactlyOnceWith('/500');
  });

  it.each([
    ['403', httpError(403, 20002)],
    ['500', httpError(500, 10004)],
  ])('does not redirect the %s response when skipRedirect is enabled', async (_name, error) => {
    service.defaults.adapter = failingAdapter(error);
    const config: RequestConfig = { skipRedirect: true };

    await expect(service.get('/no-redirect', config)).rejects.toBe(error);

    expect(push).not.toHaveBeenCalled();
  });

  it('does not show errors automatically when skipErrorMessage is enabled', async () => {
    const error = httpError(403, 20002);
    service.defaults.adapter = failingAdapter(error);
    const config: RequestConfig = { skipErrorMessage: true };

    await expect(service.get('/manual-error', config)).rejects.toBe(error);

    expect(messageError).not.toHaveBeenCalled();

    showApiError(error);
    expect(messageError).toHaveBeenCalledExactlyOnceWith($t('apiErrors.codes.20002'));
  });

  it('only shows the same error object once', () => {
    const error = httpError(403, 20002);

    showApiError(error);
    showApiError(error);

    expect(messageError).toHaveBeenCalledExactlyOnceWith($t('apiErrors.codes.20002'));
  });
});
