declare module 'virtual:icon-catalog' {
  const catalog: Record<'ri' | 'mdi' | 'ion' | 'antdv-next', string[]>;
  export default catalog;
}

declare module 'virtual:iconify-loaders' {
  const loaders: Record<
    string,
    Array<{
      last: string;
      load: () => Promise<{
        default: Parameters<typeof import('@iconify/vue').addCollection>[0];
      }>;
    }>
  >;
  export default loaders;
}

declare module 'virtual:antdv-icon-loaders' {
  const loaders: Record<string, () => Promise<{ default: import('vue').Component }>>;
  export default loaders;
}
