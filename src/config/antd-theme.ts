import { theme as antdTheme, type ThemeConfig } from 'antdv-next';

export interface AntdvThemeOptions {
  isDark: boolean;
  primaryColor: string;
}

const FONT_FAMILY =
  "'Inter', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif";

const FONT_FAMILY_CODE =
  "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace";

const LIGHT_THEME_TOKEN = {
  colorBgLayout: '#f5f7fa',
  colorBgContainer: '#ffffff',
  colorBgElevated: '#ffffff',
  colorBorderSecondary: '#f0f0f0',
};

const DARK_THEME_TOKEN = {
  colorBgLayout: '#141414',
  colorBgContainer: '#1f1f1f',
  colorBgElevated: '#262626',
  colorBorderSecondary: '#303030',
};

/**
 * Global Antdv theme shared by the root ConfigProvider and static APIs.
 * Keep the structural tokens aligned with src/assets/styles/variables.css.
 */
export function createAntdvThemeConfig({ isDark, primaryColor }: AntdvThemeOptions): ThemeConfig {
  return {
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: primaryColor,
      colorLink: primaryColor,
      fontFamily: FONT_FAMILY,
      fontFamilyCode: FONT_FAMILY_CODE,
      fontSize: 14,
      borderRadius: 8,
      controlHeight: 32,
      focusOutline: true,
      motion: true,
      wireframe: false,
      ...(isDark ? DARK_THEME_TOKEN : LIGHT_THEME_TOKEN),
    },
  };
}
