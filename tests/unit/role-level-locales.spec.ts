import { describe, expect, it } from 'vitest';

import enUS from '@/locales/en-US';
import jaJP from '@/locales/ja-JP';
import koKR from '@/locales/ko-KR';
import zhCN from '@/locales/zh-CN';

const locales = [
  ['zh-CN', zhCN],
  ['en-US', enUS],
  ['ja-JP', jaJP],
  ['ko-KR', koKR],
] as const;

/** 角色优先级相关文案键，必须四语言齐全且非空。 */
const ROLE_LEVEL_KEYS = ['level', 'levelRequired', 'levelRange', 'levelTooHigh'] as const;

describe('role level translations', () => {
  it.each(locales)('%s defines every role level message', (_locale, messages) => {
    for (const key of ROLE_LEVEL_KEYS) {
      const value = (messages.role as Record<string, string>)[key];
      expect(typeof value).toBe('string');
      expect(value.trim().length).toBeGreaterThan(0);
    }
  });

  it('keeps the reserved upper bound wording consistent with level 0~99', () => {
    for (const [locale, messages] of locales) {
      const range = (messages.role as Record<string, string>).levelRange;
      expect(range, locale).toContain('99');
    }
  });
});
