import type { ApiResponse } from '@/types/api';
import type { LoginParams, LoginResult, User } from '@/types/auth';

import { request, type RequestConfig } from '@/utils/request';

/**
 * Login
 */
export function login(data: LoginParams): Promise<ApiResponse<LoginResult>> {
  return request.post('/auth/login', data, {
    skipAuth: true,
    skipAuthRefresh: true,
    skipErrorMessage: true,
    withCredentials: true,
  });
}

/**
 * Logout
 */
export function logout(): Promise<ApiResponse<null>> {
  return request.post('/auth/logout', undefined, {
    skipAuthRefresh: true,
    withCredentials: true,
  });
}

/**
 * Get user info
 */
export function getUserInfo(config?: RequestConfig): Promise<ApiResponse<User>> {
  return request.get('/auth/info', config);
}

/**
 * Refresh token
 */
export function refreshToken(): Promise<ApiResponse<LoginResult>> {
  return request.post('/auth/refresh', undefined, {
    skipAuth: true,
    skipAuthRefresh: true,
    skipErrorMessage: true,
    skipRedirect: true,
    withCredentials: true,
  });
}
