import { Window as WailsWindow } from '@wailsio/runtime';

export interface WindowApi {
  minimize(): Promise<void>;
  maximize(): Promise<void>;
  restore(): Promise<void>;
  close(): Promise<void>;
  isMaximized(): Promise<boolean>;
}

export const windowApi: WindowApi = {
  minimize: () => WailsWindow.Minimise(),
  maximize: () => WailsWindow.Maximise(),
  restore: () => WailsWindow.Restore(),
  close: () => WailsWindow.Close(),
  isMaximized: () => WailsWindow.IsMaximised(),
};
