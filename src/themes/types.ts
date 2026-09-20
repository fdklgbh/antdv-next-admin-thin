import type { ThemeConfig } from 'antdv-next';

export interface ThemeAppearance {
  /** Selects a shared CSS material, not a theme-specific stylesheet. */
  style: string;
  blur?: number;
  mobileBlur?: number;
  surface?: string;
  variables?: Record<`--${string}`, string>;
}

/** JSON-compatible preset. Algorithm names are checked by the resolver. */
export interface ThemePreset {
  id: string;
  name: string;
  version: number;
  algorithm: string | string[];
  token?: ThemeConfig['token'];
  components?: ThemeConfig['components'];
  appearance: ThemeAppearance;
}

export interface ResolvedTheme {
  id: string;
  antd: ThemeConfig;
  appearance: ThemeAppearance;
}
