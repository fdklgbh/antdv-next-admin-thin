import type { Component } from 'vue';

export async function loadAntdvIcon(name: string): Promise<Component | undefined> {
  const { default: loaders } = await import('virtual:antdv-icon-loaders');
  const loader = Object.hasOwn(loaders, name) ? loaders[name] : undefined;
  return loader ? (await loader()).default : undefined;
}
