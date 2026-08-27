import { describe, expect, it, vi } from 'vitest';

const antdTheme = vi.hoisted(() => ({
  darkAlgorithm: () => ({}),
  defaultAlgorithm: () => ({}),
}));

vi.mock('antdv-next', () => ({
  theme: antdTheme,
}));

import { createAntdvThemeConfig } from '@/config/antd-theme';

describe('Antdv global theme configuration', () => {
  it('uses project structural tokens with the light algorithm', () => {
    const config = createAntdvThemeConfig({
      isDark: false,
      primaryColor: '#52c41a',
    });

    expect(config.algorithm).toBe(antdTheme.defaultAlgorithm);
    expect(config.token).toMatchObject({
      colorPrimary: '#52c41a',
      colorLink: '#52c41a',
      borderRadius: 8,
      controlHeight: 32,
      colorBgLayout: '#f5f7fa',
      colorBgContainer: '#ffffff',
    });
  });

  it('switches the algorithm and structural colors for dark mode', () => {
    const config = createAntdvThemeConfig({
      isDark: true,
      primaryColor: '#722ed1',
    });

    expect(config.algorithm).toBe(antdTheme.darkAlgorithm);
    expect(config.token).toMatchObject({
      colorPrimary: '#722ed1',
      colorBgLayout: '#141414',
      colorBgContainer: '#1f1f1f',
      colorBgElevated: '#262626',
      colorBorderSecondary: '#303030',
    });
  });
});
