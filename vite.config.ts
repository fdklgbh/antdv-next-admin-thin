import { AntdvNextResolver } from "@antdv-next/auto-import-resolver";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";
import Components from "unplugin-vue-components/vite";
import { defineConfig } from "vite";
import { mockDevServerPlugin } from "vite-plugin-mock-dev-server";
import { iconAssets } from './build/icon-assets.ts';
import { startupTheme } from './build/startup-theme.ts';

import pkg from './package.json' with { type: 'json' }

export default defineConfig({
  base: "/",
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
    mockDevServerPlugin({
      prefix: "/api",
      log: "error",
    }),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ["legacy-js-api"],
      },
      sass: {
        silenceDeprecations: ["legacy-js-api"],
      },
    },
  },
  resolve: {
    // CodeMirror extensions must share the same runtime classes across wrappers and languages.
    dedupe: ["vue", "@codemirror/state", "@codemirror/view", "@codemirror/language"],
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  optimizeDeps: {
    // The virtual icon loader shares this entry in dev; discover it before navigation.
    include: ["@antdv-next/icons"],
  },
  server: {
    port: 3000,
    open: false,
    proxy: {},
  },
  build: {
    target: "es2020",
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
  },
});
