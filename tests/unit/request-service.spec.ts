import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { clearSessionState, push, refreshToken } = vi.hoisted(() => ({
  clearSessionState: vi.fn(),
  push: vi.fn(),
  refreshToken: vi.fn(),
}));

vi.mock('antdv-next', () => ({
  message: {
    error: vi.fn(),
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

import { service } from '@/utils/request';

const originalAdapter = service.defaults.adapter;

function httpError(
  status: number,
  code: number,
  config: InternalAxiosRequestConfig = { headers: new AxiosHeaders() },
): AxiosError {
  return new AxiosError('request failed', AxiosError.ERR_BAD_RESPONSE, config, undefined, {
    status,
    statusText: '',
    headers: {},
    config,
    data: { code, message: '请求失败', data: null },
  });
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
