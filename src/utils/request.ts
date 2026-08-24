import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';

import { message } from 'antdv-next';

export interface RequestConfig extends AxiosRequestConfig {
  skipErrorMessage?: boolean;
}

export const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

service.interceptors.request.use(
  (config) => config,
  (error: AxiosError) => {
    console.error('Request error:', error);
    if (!(error.config as RequestConfig | undefined)?.skipErrorMessage) {
      message.error('请求发送失败');
    }
    return Promise.reject(error);
  },
);

service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data;
    const requestConfig = response.config as RequestConfig;

    if (res.code !== undefined && res.code !== 200) {
      if (!requestConfig.skipErrorMessage) {
        message.error(res.message || '请求失败');
      }
      return Promise.reject(new Error(res.message || 'Error'));
    }

    return response;
  },
  (error: AxiosError) => {
    const requestConfig = error.config as RequestConfig | undefined;

    if (error.response) {
      const { status } = error.response;
      if (!requestConfig?.skipErrorMessage) {
        const messageByStatus: Record<number, string> = {
          400: '请求参数错误',
          401: '请求未获批准',
          403: '请求被拒绝',
          404: '请求的资源不存在',
          500: '服务器错误，请稍后重试',
        };
        message.error(messageByStatus[status] || `请求失败（${status}）`);
      }
    } else if (error.request) {
      if (!requestConfig?.skipErrorMessage) {
        message.error('网络连接失败，请检查网络');
      }
    } else if (!requestConfig?.skipErrorMessage) {
      message.error('请求配置错误');
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
