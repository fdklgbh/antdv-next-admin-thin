import { Browser, System, Window as WailsWindow } from '@wailsio/runtime';

// Wails 版本适配入口，组件只使用项目内接口。
export const windowApi = {
  minimize: () => WailsWindow.Minimise(),
  maximize: () => WailsWindow.Maximise(),
  restore: () => WailsWindow.Restore(),
  toggleMaximize: () => WailsWindow.ToggleMaximise(),
  close: () => WailsWindow.Close(),
  isMaximized: () => WailsWindow.IsMaximised(),
  // v3 在 macOS 捕获双击并遵循系统标题栏偏好。
  handlesDragDoubleClick: () => System.IsMac(),
};

export const browserApi = {
  openURL: (url: string): Promise<void> => Browser.OpenURL(url),
};
