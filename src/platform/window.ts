import { windowApi as runtimeWindowApi } from './runtime';

export interface WindowApi {
  minimize(): Promise<void>;
  maximize(): Promise<void>;
  restore(): Promise<void>;
  toggleMaximize(): Promise<void>;
  handlesDragDoubleClick(): boolean;
  close(): Promise<void>;
  isMaximized(): Promise<boolean>;
}

export const windowApi: WindowApi = runtimeWindowApi;
