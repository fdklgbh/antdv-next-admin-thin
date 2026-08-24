import { describe, expect, it } from 'vitest';

import { resolveLocalizedText } from '@/utils/localizedText';

describe('resolveLocalizedText', () => {
  const localizedName = {
    'zh-CN': '团队管理',
    'en-US': 'Team Management',
    'ja-JP': 'チーム管理',
  };

  it('returns plain strings without modification', () => {
    expect(resolveLocalizedText('Dashboard', 'zh-CN')).toBe('Dashboard');
  });

  it('selects the current locale and never stringifies the object', () => {
    const label = `${resolveLocalizedText(localizedName, 'en-US')} (system.team.view)`;

    expect(label).toBe('Team Management (system.team.view)');
    expect(label).not.toContain('[object Object]');
  });

  it('falls back to Chinese, English, and then the first available value', () => {
    expect(resolveLocalizedText(localizedName, 'ko-KR')).toBe('团队管理');
    expect(resolveLocalizedText({ 'en-US': 'Team Management' }, 'ko-KR')).toBe('Team Management');
    expect(resolveLocalizedText({ custom: 'Custom team' }, 'ko-KR')).toBe('Custom team');
  });

  it('returns an empty string for empty values', () => {
    expect(resolveLocalizedText(undefined, 'zh-CN')).toBe('');
    expect(resolveLocalizedText(null, 'zh-CN')).toBe('');
    expect(resolveLocalizedText({}, 'zh-CN')).toBe('');
  });
});
