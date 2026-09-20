import { addCollection, iconLoaded } from '@iconify/vue';

export type LocalIconifyPrefix = 'ri' | 'mdi' | 'ion';

const localPrefixes = new Set<string>(['ri', 'mdi', 'ion']);
const loadPromises = new Map<string, Promise<void>>();

export const isLocalIconifyPrefix = (prefix: string): prefix is LocalIconifyPrefix =>
  localPrefixes.has(prefix);

export async function loadLocalIconifyIcon(
  prefix: LocalIconifyPrefix,
  name: string,
): Promise<boolean> {
  if (iconLoaded(`${prefix}:${name}`)) return true;
  const { default: loaders } = await import('virtual:iconify-loaders');
  const group = loaders[prefix].find((entry) => name <= entry.last);
  if (!group) return false;
  const key = `${prefix}:${group.last}`;
  let promise = loadPromises.get(key);
  if (!promise) {
    promise = (async () => {
      const { default: collection } = await group.load();
      if (!addCollection(collection)) throw new Error(`Invalid icon collection: ${key}`);
    })().catch((error: unknown) => {
      loadPromises.delete(key);
      throw error;
    });
    loadPromises.set(key, promise);
  }
  await promise;
  return iconLoaded(`${prefix}:${name}`);
}
