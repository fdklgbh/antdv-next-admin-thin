import {
  BrowserOpenURL,
  Environment,
  Quit,
  WindowIsMaximised,
  WindowMaximise,
  WindowMinimise,
  WindowToggleMaximise,
  WindowUnmaximise,
} from '@wails/runtime/runtime';

// Wails 版本适配入口；同步命令统一为 Promise，与 v3 组件契约一致。
export const windowApi = {
  minimize: async () => WindowMinimise(),
  maximize: async () => WindowMaximise(),
  restore: async () => WindowUnmaximise(),
  toggleMaximize: async () => WindowToggleMaximise(),
  close: async () => Quit(),
  isMaximized: () => WindowIsMaximised(),
  // v2.15 的 runtime 未接管 DOM 双击，由共享指令处理。
  handlesDragDoubleClick: () => false,
};

export const browserApi = {
  openURL: async (url: string): Promise<void> => BrowserOpenURL(url),
};

export const systemApi = {
  environment: () => Environment(),
};
