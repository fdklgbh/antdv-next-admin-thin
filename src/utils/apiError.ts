import { message } from 'antdv-next';
import { isAxiosError } from 'axios';

import i18n, { $t } from '@/locales';
import { SessionChangedError } from '@/utils/authSession';

const displayedErrors = new WeakSet<object>();

/** 按当前语言解析业务码，未知业务码使用后端中文文案。 */
export function resolveApiError(error: unknown, fallback = $t('apiErrors.requestFailed')): string {
  const response = isAxiosError(error) ? error.response : undefined;
  const body: unknown = response ? response.data : error;
  if (typeof body === 'object' && body !== null) {
    if ('code' in body && typeof body.code === 'number' && body.code !== 0 && body.code !== 200) {
      const key = `apiErrors.codes.${body.code}`;
      if (i18n.global.te(key)) return $t(key);
    }
    if (
      'message' in body &&
      typeof body.message === 'string' &&
      body.message.trim() &&
      !(body instanceof Error)
    ) {
      return body.message;
    }
  }
  if (response) {
    const key = `apiErrors.http.${response.status}`;
    return i18n.global.te(key) ? $t(key) : fallback;
  }
  if (isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return $t('apiErrors.timeout');
    if (error.code === 'ERR_CANCELED') return $t('apiErrors.canceled');
    if (error.request || error.code === 'ERR_NETWORK') return $t('apiErrors.network');
  }
  return fallback;
}

/** 同一次异常仅提示一次，页面仍可使用 skipErrorMessage 自行接管提示。 */
export function showApiError(error: unknown, fallback?: string): void {
  if (error instanceof SessionChangedError) return;
  if (typeof error === 'object' && error !== null) {
    if (displayedErrors.has(error)) return;
    displayedErrors.add(error);
  }
  message.error(resolveApiError(error, fallback));
}
