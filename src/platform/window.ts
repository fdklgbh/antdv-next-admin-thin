import {
  Quit,
  WindowIsMaximised,
  WindowMaximise,
  WindowMinimise,
  WindowUnmaximise,
} from '@wails/runtime/runtime';

export interface WindowApi {
  minimize(): void;
  maximize(): void;
  restore(): void;
  close(): void;
  isMaximized(): Promise<boolean>;
}

export const windowApi: WindowApi = {
  minimize: WindowMinimise,
  maximize: WindowMaximise,
  restore: WindowUnmaximise,
  close: Quit,
  isMaximized: WindowIsMaximised,
};
