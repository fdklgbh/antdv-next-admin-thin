import type { LocalIconifyPrefix } from '@/utils/iconify';

export type SupportedIconLibrary = LocalIconifyPrefix | 'antdv-next';

export interface IconCatalogItem {
  name: string;
  library: SupportedIconLibrary;
}

export async function loadIconNames(library: SupportedIconLibrary): Promise<string[]> {
  const { default: catalog } = await import('virtual:icon-catalog');
  return catalog[library].map((name) => `${library}:${name}`);
}

export async function loadSupportedIconCatalog(): Promise<IconCatalogItem[]> {
  const libraries: SupportedIconLibrary[] = ['ri', 'mdi', 'ion', 'antdv-next'];
  const groups = await Promise.all(
    libraries.map(async (library) => {
      const names = await loadIconNames(library);
      return names.toSorted((a, b) => a.localeCompare(b)).map((name) => ({ name, library }));
    }),
  );
  return groups.flat();
}
