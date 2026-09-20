import type { ResolvedTheme } from '@/themes/types';
import type { DarkThemeStyle, LightThemeStyle } from '@/types/layout';
import type { ThemeConfig } from 'antdv-next';

import { darkThemePresets, lightThemePresets } from '@/themes';
import { resolveTheme } from '@/themes/resolve';

export interface AntdvThemeOptions {
  isDark: boolean;
  primaryColor: string;
  darkThemeStyle?: DarkThemeStyle;
  lightThemeStyle?: LightThemeStyle;
}

/** Compatibility mapping for the existing settings; all visual values live in presets. */
export function createAppThemeConfig({
  isDark,
  primaryColor,
  darkThemeStyle = 'default',
  lightThemeStyle = 'default',
}: AntdvThemeOptions): ResolvedTheme {
  const preset = isDark
    ? darkThemePresets[darkThemeStyle].preset
    : lightThemePresets[lightThemeStyle].preset;
  return resolveTheme(preset, {
    token: { colorPrimary: primaryColor, colorLink: primaryColor },
  });
}

/** Shared by ConfigProvider and consumers that only need Antdv tokens. */
export function createAntdvThemeConfig(options: AntdvThemeOptions): ThemeConfig {
  return createAppThemeConfig(options).antd;
}
