import type { SupportedLanguage, EditorTheme } from './index.vue';
import type { Extension } from '@codemirror/state';

import { linter } from '@codemirror/lint';

const languages: Record<SupportedLanguage, () => Promise<Extension>> = {
  json: async () => {
    const language = await import('@codemirror/lang-json');
    return [language.json(), linter(language.jsonParseLinter())];
  },
  javascript: () => import('@codemirror/lang-javascript').then((m) => m.javascript()),
  typescript: () =>
    import('@codemirror/lang-javascript').then((m) => m.javascript({ typescript: true })),
  css: () => import('@codemirror/lang-css').then((m) => m.css()),
  go: () => import('@codemirror/lang-go').then((m) => m.go()),
  html: () => import('@codemirror/lang-html').then((m) => m.html()),
  java: () => import('@codemirror/lang-java').then((m) => m.java()),
  markdown: () => import('@codemirror/lang-markdown').then((m) => m.markdown()),
  php: () => import('@codemirror/lang-php').then((m) => m.php()),
  python: () => import('@codemirror/lang-python').then((m) => m.python()),
  rust: () => import('@codemirror/lang-rust').then((m) => m.rust()),
  sql: () => import('@codemirror/lang-sql').then((m) => m.sql()),
  xml: () => import('@codemirror/lang-xml').then((m) => m.xml()),
  yaml: () => import('@codemirror/lang-yaml').then((m) => m.yaml()),
};

type ResolvedTheme = Exclude<EditorTheme, 'auto'>;
const themes: Record<ResolvedTheme, () => Promise<Extension>> = {
  light: () => Promise.resolve([]),
  dark: () => import('@codemirror/theme-one-dark').then((m) => m.oneDark),
  github: () => import('@uiw/codemirror-theme-github').then((m) => m.githubLight),
  githubDark: () => import('@uiw/codemirror-theme-github').then((m) => m.githubDark),
  dracula: () => import('@uiw/codemirror-theme-dracula').then((m) => m.dracula),
  material: () => import('@uiw/codemirror-theme-material').then((m) => m.material),
  materialDark: () => import('@uiw/codemirror-theme-material').then((m) => m.materialDark),
  monokai: () => import('@uiw/codemirror-theme-monokai').then((m) => m.monokai),
  nord: () => import('@uiw/codemirror-theme-nord').then((m) => m.nord),
  solarized: () => import('@uiw/codemirror-theme-solarized').then((m) => m.solarizedLight),
  solarizedDark: () => import('@uiw/codemirror-theme-solarized').then((m) => m.solarizedDark),
  tokyoNight: () => import('@uiw/codemirror-theme-tokyo-night').then((m) => m.tokyoNight),
};

const cache = new Map<string, Promise<Extension>>();

function load(key: string, loader: () => Promise<Extension>): Promise<Extension> {
  let promise = cache.get(key);
  if (!promise) {
    promise = loader().catch((error: unknown) => {
      cache.delete(key);
      throw error;
    });
    cache.set(key, promise);
  }
  return promise;
}

export function loadLanguage(language: SupportedLanguage): Promise<Extension> {
  return load(`language:${language}`, languages[language]);
}

export function loadTheme(theme: ResolvedTheme): Promise<Extension> {
  return load(`theme:${theme}`, themes[theme]);
}
