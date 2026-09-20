import type { ResolvedTheme, ThemePreset } from './types';

import { theme, type ThemeConfig } from 'antdv-next';

const BASE_TOKEN: ThemeConfig['token'] = {
  fontFamily:
    "'Inter', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
  fontFamilyCode:
    "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
  fontSize: 14,
  borderRadius: 8,
  controlHeight: 32,
  focusOutline: true,
  motion: true,
  wireframe: false,
};

function resolveAlgorithm(name: string) {
  switch (name) {
    case 'light':
      return theme.defaultAlgorithm;
    case 'dark':
      return theme.darkAlgorithm;
    case 'compact':
      return theme.compactAlgorithm;
    default:
      throw new Error(`Unsupported theme algorithm: ${name}`);
  }
}

function mergeComponents(
  base: ThemeConfig['components'],
  overrides: ThemeConfig['components'],
): ThemeConfig['components'] {
  if (!base && !overrides) return undefined;
  const merged = { ...base };
  // Merge each component's fields, so overriding one token preserves the others.
  for (const key of Object.keys(overrides ?? {}) as Array<
    keyof NonNullable<ThemeConfig['components']>
  >) {
    Object.assign(merged, { [key]: { ...base?.[key], ...overrides?.[key] } });
  }
  return merged;
}

export function resolveTheme(
  preset: ThemePreset,
  overrides: Pick<ThemeConfig, 'token' | 'components'> = {},
): ResolvedTheme {
  if (preset.version !== 1) throw new Error(`Unsupported theme version: ${preset.version}`);
  if (!['default', 'glass'].includes(preset.appearance.style)) {
    throw new Error(`Unsupported theme style: ${preset.appearance.style}`);
  }
  const components = mergeComponents(preset.components, overrides.components);
  return {
    id: preset.id,
    appearance: preset.appearance,
    antd: {
      algorithm: Array.isArray(preset.algorithm)
        ? preset.algorithm.map(resolveAlgorithm)
        : resolveAlgorithm(preset.algorithm),
      token: { ...BASE_TOKEN, ...preset.token, ...overrides.token },
      ...(components ? { components } : {}),
    },
  };
}
