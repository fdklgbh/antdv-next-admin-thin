import type { ResolvedTheme } from './types';

import getDesignToken from 'antdv-next/dist/theme/getDesignToken';

const appliedVariables = new WeakMap<HTMLElement, Set<string>>();

/** Keeps legacy preference attributes while final colors are applied by syncThemeCssVariables. */
export function syncPrimaryColorPreference(hex: string, preset?: string): void {
  const root = document.documentElement;
  const managed = appliedVariables.has(root);
  if (preset) {
    if (!managed) {
      root.style.removeProperty('--color-primary');
      for (let index = 1; index <= 10; index += 1) {
        root.style.removeProperty(`--color-primary-${index}`);
      }
    }
    root.setAttribute('data-primary-color', preset);
  } else {
    root.removeAttribute('data-primary-color');
    if (!managed) root.style.setProperty('--color-primary', hex);
  }
  // Once mounted, the App watcher owns these variables, including repeated selection.
  if (!managed) root.style.setProperty('--ant-primary-color', hex);
}

/** Derive layout colors from the same final config used by ConfigProvider. */
export function syncThemeCssVariables(
  resolved: ResolvedTheme,
  root: HTMLElement = document.documentElement,
): void {
  const token = getDesignToken(resolved.antd);
  const { appearance } = resolved;
  const variables: Record<string, string> = {
    '--color-bg-layout': token.colorBgLayout,
    '--color-bg-container': token.colorBgContainer,
    '--color-bg-elevated': token.colorBgElevated,
    '--color-bg-mask': token.colorBgMask,
    '--color-text-primary': token.colorText,
    '--color-text-secondary': token.colorTextSecondary,
    '--color-text-tertiary': token.colorTextTertiary,
    '--color-text-quaternary': token.colorTextQuaternary,
    '--color-border': token.colorBorder,
    '--color-border-secondary': token.colorBorderSecondary,
    '--color-fill-quaternary': token.colorFillQuaternary,
    '--color-primary': token.colorPrimary,
    '--ant-primary-color': token.colorPrimary,
    '--color-primary-bg': token.colorPrimaryBg,
    '--color-primary-bg-hover': token.colorPrimaryBgHover,
    '--color-success': token.colorSuccess,
    '--color-success-bg': token.colorSuccessBg,
    '--color-success-border': token.colorSuccessBorder,
    '--color-warning': token.colorWarning,
    '--color-warning-bg': token.colorWarningBg,
    '--color-warning-border': token.colorWarningBorder,
    '--color-error': token.colorError,
    '--color-error-bg': token.colorErrorBg,
    '--color-error-border': token.colorErrorBorder,
    '--color-info': token.colorInfo,
    '--color-info-bg': token.colorInfoBg,
    '--color-info-border': token.colorInfoBorder,
  };
  [
    token.colorPrimaryBg,
    token.colorPrimaryBgHover,
    token.colorPrimaryBorder,
    token.colorPrimaryBorderHover,
    token.colorPrimaryHover,
    token.colorPrimary,
    token.colorPrimaryActive,
    token.colorPrimaryTextHover,
    token.colorPrimaryText,
    token.colorPrimaryTextActive,
  ].forEach((color, index) => {
    variables[`--color-primary-${index + 1}`] = color;
  });

  if (appearance.style === 'glass') {
    const button = resolved.antd.components?.Button;
    Object.assign(variables, {
      '--glass-config-blur': `${appearance.blur ?? 0}px`,
      '--glass-config-mobile-blur': `${appearance.mobileBlur ?? appearance.blur ?? 0}px`,
      '--glass-config-surface': appearance.surface ?? token.colorBgContainer,
      // Share neutral button tokens with CSS instead of duplicating them in the preset.
      '--glass-neutral-bg': button?.defaultBg ?? token.colorBgContainer,
      '--glass-neutral-bg-hover': button?.defaultHoverBg ?? token.colorBgContainer,
      '--glass-neutral-bg-active': button?.defaultActiveBg ?? token.colorBgContainer,
      '--glass-neutral-border': button?.defaultBorderColor ?? token.colorBorder,
      '--glass-neutral-border-hover': button?.defaultHoverBorderColor ?? token.colorPrimaryHover,
      '--glass-neutral-border-active': button?.defaultActiveBorderColor ?? token.colorPrimaryActive,
      '--glass-neutral-text': button?.defaultColor ?? token.colorText,
      '--glass-neutral-text-hover': button?.defaultHoverColor ?? token.colorPrimaryHover,
      '--glass-neutral-text-active': button?.defaultActiveColor ?? token.colorPrimaryActive,
    });
  }
  Object.assign(variables, appearance.variables);

  // Remove only variables owned by the previous theme; leave unrelated inline styles intact.
  for (const name of appliedVariables.get(root) ?? []) {
    if (!(name in variables)) root.style.removeProperty(name);
  }
  for (const [name, value] of Object.entries(variables)) {
    root.style.setProperty(name, value);
  }
  appliedVariables.set(root, new Set(Object.keys(variables)));
  root.setAttribute('data-theme', resolved.id);
  root.setAttribute('data-theme-style', appearance.style);
}
