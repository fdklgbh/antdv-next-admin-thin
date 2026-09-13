<template>
  <a-config-provider
    :theme="antdThemeConfig"
    :input="inputConfig"
    :select="selectConfig"
    :date-picker="datePickerConfig"
    :range-picker="datePickerConfig"
    :button="buttonConfig"
    :modal="modalConfig"
    :locale="antdLocale"
  >
    <a-app :message="messageConfig" :notification="notificationConfig">
      <router-view />
    </a-app>
  </a-config-provider>
</template>

<script setup lang="ts">
import { App as AntApp, ConfigProvider } from 'antdv-next';
import enUS from 'antdv-next/dist/locale/en_US';
import jaJP from 'antdv-next/dist/locale/ja_JP';
import koKR from 'antdv-next/dist/locale/ko_KR';
import zhCN from 'antdv-next/dist/locale/zh_CN';
import { computed, h, onMounted, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';

import { createAntdvThemeConfig } from '@/config/antd-theme';

import { appDefaultSettings } from './settings';
import { useNotificationStore } from './stores/notification';
import { useSettingsStore } from './stores/settings';
import { useThemeStore } from './stores/theme';
import { useWatermarkStore } from './stores/watermark';

const themeStore = useThemeStore();
const settingsStore = useSettingsStore();
const watermarkStore = useWatermarkStore();
const notificationStore = useNotificationStore();
const { locale } = useI18n();

// Restore the theme before the first component render replaces the splash.
themeStore.initTheme();
settingsStore.initSettings();

const antdLocaleMap = {
  'zh-CN': zhCN,
  'en-US': enUS,
  'ja-JP': jaJP,
  'ko-KR': koKR,
};

const antdThemeConfig = computed(() => {
  return createAntdvThemeConfig({
    isDark: themeStore.isDark,
    primaryColor: settingsStore.primaryColorHex,
  });
});

const inputConfig = computed(() => appDefaultSettings.input);
const selectConfig = computed(
  () => appDefaultSettings.select as unknown as Record<string, unknown>,
);
const datePickerConfig = computed(
  () => appDefaultSettings.datePicker as unknown as Record<string, unknown>,
);
const buttonConfig = computed(() => appDefaultSettings.button);
const modalConfig = { centered: true };
const messageConfig = { top: 72 };
const notificationConfig = { top: 72 };
const antdLocale = computed(() => {
  return antdLocaleMap[locale.value as keyof typeof antdLocaleMap] ?? zhCN;
});

watchEffect(() => {
  const currentTheme = antdThemeConfig.value;
  const currentLocale = antdLocale.value;

  ConfigProvider.config({
    holderRender: (children) =>
      h(
        ConfigProvider,
        {
          locale: currentLocale,
          theme: currentTheme,
          modal: modalConfig,
        },
        () =>
          h(AntApp, { message: messageConfig, notification: notificationConfig }, () => children),
      ),
  });
});

notificationStore.initNotifications();

onMounted(() => {
  watermarkStore.initWatermark();
});
</script>

<style>
#app {
  width: 100%;
  height: 100vh;
  font-family: var(--font-family);
  color: var(--color-text-primary);
  background-color: var(--color-bg-layout);
}
</style>
