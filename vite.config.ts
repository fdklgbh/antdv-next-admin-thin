import { AntdvNextResolver } from '@antdv-next/auto-import-resolver';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import Components from 'unplugin-vue-components/vite';
import { defineConfig, loadEnv } from 'vite';
import { mockDevServerPlugin } from 'vite-plugin-mock-dev-server';

import { iconAssets } from './build/icon-assets.ts';
import { startupTheme } from './build/startup-theme.ts';
import pkg from './package.json' with { type: 'json' };

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: '/',
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    plugins: [
      startupTheme(),
      iconAssets(),
      vue(),
      Components({
        dts: false,
        resolvers: [
          AntdvNextResolver({
            exclude: [/^Select$/, /^DatePicker$/, /^DateRangePicker$/],
          }),
        ],
      }),
      tailwindcss(),
      ...(env.VITE_USE_MOCK === 'true'
        ? [mockDevServerPlugin({ prefix: '/api', log: 'error' })]
        : []),
    ],
    css: {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: ['legacy-js-api'],
        },
        sass: {
          silenceDeprecations: ['legacy-js-api'],
        },
      },
    },
    resolve: {
      // CodeMirror extensions must share the same runtime classes across wrappers and languages.
      dedupe: ['vue', '@codemirror/state', '@codemirror/view', '@codemirror/language'],
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    optimizeDeps: {
      // The virtual icon loader shares this entry in dev; discover it before navigation.
      include: ['@antdv-next/icons'],
    },
    server: {
      port: 3000,
      open: false,
      proxy: env.API_PROXY_TARGET
        ? {
            '/api': {
              target: env.API_PROXY_TARGET,
              changeOrigin: true,
              configure(proxy) {
                proxy.on('proxyRes', (response, request) => {
                  const path = request.url?.split('?')[0];
                  if (
                    response.statusCode === 403 &&
                    ['/api/auth/login', '/api/auth/refresh', '/api/auth/logout'].includes(path ?? '')
                  ) {
                    console.warn('[auth] 后端拒绝认证请求，请核对 auth.allowedOrigins', {
                      path,
                      origin: request.headers.origin ?? '(missing)',
                      fetchSite: request.headers['sec-fetch-site'] ?? '(missing)',
                      target: env.API_PROXY_TARGET,
                    });
                  }
                });
              },
            },
          }
        : {},
    },
    build: {
      target: 'es2020',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      chunkSizeWarningLimit: 1500,
    },
  };
});
