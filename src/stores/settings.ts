import type {
  DarkThemeStyle,
  LightThemeStyle,
  PrimaryColor,
  SidebarTheme,
  LayoutMode,
  PageAnimation,
} from '@/types/layout';

import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { isDarkThemeStyle, isLightThemeStyle } from '@/themes';
import { syncPrimaryColorPreference } from '@/themes/sync-css-vars';

const PAGE_ANIMATION_VALUES: Set<string> = new Set([
  'fade',
  'slide-left',
  'slide-right',
  'slide-up',
  'slide-down',
  'zoom',
  'zoom-big',
  'none',
]);

const PRIMARY_COLOR_HEX_MAP: Record<PrimaryColor, string> = {
  blue: '#1890ff',
  green: '#52c41a',
  purple: '#722ed1',
  red: '#f5222d',
  orange: '#fa8c16',
  cyan: '#13c2c2',
  gold: '#e4b863',
};

const isPrimaryColor = (color: string): color is PrimaryColor => color in PRIMARY_COLOR_HEX_MAP;

export const useSettingsStore = defineStore('settings', () => {
  // State
  const primaryColor = ref<PrimaryColor>('blue');
  const customPrimaryColor = ref<string>('');
  const primaryColorHex = computed(
    () => customPrimaryColor.value || PRIMARY_COLOR_HEX_MAP[primaryColor.value],
  );
  const sidebarTheme = ref<SidebarTheme>('light');
  const darkThemeStyle = ref<DarkThemeStyle>('default');
  const lightThemeStyle = ref<LightThemeStyle>('default');
  const layoutMode = ref<LayoutMode>('vertical');
  const pageAnimation = ref<PageAnimation>('slide-left');
  const grayMode = ref(false);
  const rememberTabState = ref(true);
  const showLanguageSwitch = ref(true);

  // Actions
  function setDarkThemeStyle(style: DarkThemeStyle): void {
    darkThemeStyle.value = style;
    document.documentElement.setAttribute('data-dark-theme-style', style);
    localStorage.setItem('app-dark-theme-style', style);
  }

  function setLightThemeStyle(style: LightThemeStyle): void {
    lightThemeStyle.value = style;
    localStorage.setItem('app-light-theme-style', style);
  }

  const setPrimaryColor = (color: PrimaryColor) => {
    primaryColor.value = color;
    customPrimaryColor.value = '';
    syncPrimaryColorPreference(PRIMARY_COLOR_HEX_MAP[color], color);
    localStorage.setItem('app-primary-color', color);
    localStorage.removeItem('app-custom-primary-color');
  };

  const setCustomPrimaryColor = (hex: string) => {
    customPrimaryColor.value = hex;
    syncPrimaryColorPreference(hex);
    localStorage.setItem('app-custom-primary-color', hex);
  };

  const setSidebarTheme = (theme: SidebarTheme) => {
    sidebarTheme.value = theme;
    localStorage.setItem('app-sidebar-theme', theme);
  };

  const setLayoutMode = (mode: LayoutMode) => {
    layoutMode.value = mode;
    localStorage.setItem('app-layout-mode', mode);
  };

  const setPageAnimation = (animation: PageAnimation) => {
    pageAnimation.value = animation;
    localStorage.setItem('app-page-animation', animation);
  };

  const setGrayMode = (enabled: boolean) => {
    grayMode.value = enabled;
    document.documentElement.classList.toggle('gray-mode', enabled);
    localStorage.setItem('app-gray-mode', enabled.toString());
  };

  const setRememberTabState = (enabled: boolean) => {
    rememberTabState.value = enabled;
    localStorage.setItem('app-remember-tab-state', enabled.toString());
  };

  const setShowLanguageSwitch = (enabled: boolean) => {
    showLanguageSwitch.value = enabled;
    localStorage.setItem('app-show-language-switch', enabled.toString());
  };

  const resetSettings = () => {
    setDarkThemeStyle('default');
    setLightThemeStyle('default');
    setPrimaryColor('blue');
    setSidebarTheme('dark');
    setLayoutMode('vertical');
    setPageAnimation('slide-left');
    setGrayMode(false);
    setRememberTabState(true);
    setShowLanguageSwitch(true);
  };

  const initSettings = () => {
    // Restore from localStorage
    const savedDarkThemeStyle = localStorage.getItem('app-dark-theme-style');
    setDarkThemeStyle(isDarkThemeStyle(savedDarkThemeStyle) ? savedDarkThemeStyle : 'default');
    const savedLightThemeStyle = localStorage.getItem('app-light-theme-style');
    setLightThemeStyle(isLightThemeStyle(savedLightThemeStyle) ? savedLightThemeStyle : 'default');
    const savedPrimaryColor = localStorage.getItem('app-primary-color');
    const savedCustomPrimaryColor = localStorage.getItem('app-custom-primary-color');
    const savedSidebarTheme = localStorage.getItem('app-sidebar-theme') as SidebarTheme;
    const savedLayoutMode = localStorage.getItem('app-layout-mode') as LayoutMode;
    const savedPageAnimation = localStorage.getItem('app-page-animation') as PageAnimation;
    const savedGrayMode = localStorage.getItem('app-gray-mode');
    const savedRememberTabState = localStorage.getItem('app-remember-tab-state');
    const savedShowLanguageSwitch = localStorage.getItem('app-show-language-switch');

    if (savedCustomPrimaryColor) {
      setCustomPrimaryColor(savedCustomPrimaryColor);
    } else if (savedPrimaryColor && isPrimaryColor(savedPrimaryColor)) {
      setPrimaryColor(savedPrimaryColor);
    }
    if (savedSidebarTheme) setSidebarTheme(savedSidebarTheme);
    if (savedLayoutMode) setLayoutMode(savedLayoutMode);
    if (savedPageAnimation && PAGE_ANIMATION_VALUES.has(savedPageAnimation)) {
      setPageAnimation(savedPageAnimation);
    }
    if (savedGrayMode) setGrayMode(savedGrayMode === 'true');
    rememberTabState.value = savedRememberTabState !== 'false';
    if (savedShowLanguageSwitch !== null) {
      showLanguageSwitch.value = savedShowLanguageSwitch !== 'false';
    }
  };

  return {
    // State
    primaryColor,
    customPrimaryColor,
    primaryColorHex,
    sidebarTheme,
    darkThemeStyle,
    lightThemeStyle,
    layoutMode,
    pageAnimation,
    grayMode,
    rememberTabState,
    showLanguageSwitch,
    // Actions
    setPrimaryColor,
    setCustomPrimaryColor,
    setSidebarTheme,
    setDarkThemeStyle,
    setLightThemeStyle,
    setLayoutMode,
    setPageAnimation,
    setGrayMode,
    setRememberTabState,
    setShowLanguageSwitch,
    resetSettings,
    initSettings,
  };
});
