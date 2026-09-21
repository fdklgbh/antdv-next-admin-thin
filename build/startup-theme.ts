import type { ThemePreset } from '../src/themes/types.ts';
import type { Plugin } from 'vite';

import { darkThemePresets, lightThemePresets } from '../src/themes/index.ts';

/** Inline only the loading screen's theme data, before any application modules load. */
export function startupTheme(): Plugin {
  const styles: string[] = [];
  function collect(presets: Record<string, { preset: ThemePreset }>, dark: boolean) {
    return Object.fromEntries(
      Object.entries(presets).map(([key, { preset }]) => {
        const declarations = Object.entries(preset.appearance.variables ?? {})
          .filter(([name]) => name.startsWith('--app-loading-'))
          .map(([name, value]) => `${name}:${value};`)
          .join('');
        styles.push(`html[data-startup-theme="${preset.id}"] #app-loading{${declarations}}`);
        return [
          key,
          {
            id: preset.id,
            background: preset.token?.colorBgLayout ?? (dark ? '#141414' : '#f5f7fa'),
            text: preset.token?.colorText ?? (dark ? '#ededed' : '#262626'),
          },
        ];
      }),
    );
  }
  const presets = {
    light: collect(lightThemePresets, false),
    dark: collect(darkThemePresets, true),
  };

  return {
    name: 'startup-theme',
    transformIndexHtml(html) {
      return {
        html: html.replace(
          '__APP_STARTUP_THEMES__',
          JSON.stringify(presets).replace(/</g, '\\u003c'),
        ),
        tags: [
          {
            tag: 'style',
            attrs: { id: 'startup-theme-styles' },
            children: styles.join('\n'),
            injectTo: 'head',
          },
        ],
      };
    },
  };
}
