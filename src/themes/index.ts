import type { ThemePreset } from './types.ts';

import defaultDark from './presets/default-dark.json' with { type: 'json' };
import defaultLight from './presets/default-light.json' with { type: 'json' };
import midnightGlass from './presets/midnight-glass.json' with { type: 'json' };

export const themePresets = {
  'default-light': defaultLight,
  'default-dark': defaultDark,
  'midnight-glass': midnightGlass,
} satisfies Record<string, ThemePreset>;

export type ThemePresetId = keyof typeof themePresets;

export const lightThemePresets = {
  default: { preset: themePresets['default-light'], labelKey: 'settings.darkThemeDefault' },
};

/** Keys preserve existing saved settings. Register additional dark themes here. */
export const darkThemePresets = {
  default: { preset: themePresets['default-dark'], labelKey: 'settings.darkThemeDefault' },
  glass: { preset: themePresets['midnight-glass'], labelKey: 'settings.darkThemeGlass' },
};

export function isDarkThemeStyle(value: string | null): value is keyof typeof darkThemePresets {
  return value !== null && Object.hasOwn(darkThemePresets, value);
}

export function isLightThemeStyle(value: string | null): value is keyof typeof lightThemePresets {
  return value !== null && Object.hasOwn(lightThemePresets, value);
}
