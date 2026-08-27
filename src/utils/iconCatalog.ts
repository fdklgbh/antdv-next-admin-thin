import type { LocalIconifyPrefix, IconsJson } from '@/utils/iconify';

import { loadLocalIconifySet } from '@/utils/iconify';

export type SupportedIconLibrary = LocalIconifyPrefix | 'antdv-next';

export interface IconCatalogItem {
  name: string;
  library: SupportedIconLibrary;
}

const ICONIFY_LIBRARIES: readonly LocalIconifyPrefix[] = ['ri', 'mdi', 'ion'];
const ANTDV_ICON_SUFFIX = /(Outlined|Filled|TwoTone)$/;

function getIconifyItems(prefix: LocalIconifyPrefix, iconsJson: IconsJson): IconCatalogItem[] {
  const names = [...Object.keys(iconsJson.icons || {}), ...Object.keys(iconsJson.aliases || {})];

  return Array.from(new Set(names))
    .toSorted((first, second) => first.localeCompare(second))
    .map((name) => ({
      name: `${prefix}:${name}`,
      library: prefix,
    }));
}

async function loadAntdvItems(): Promise<IconCatalogItem[]> {
  const icons = await import('@antdv-next/icons');

  return Object.keys(icons)
    .filter((name) => ANTDV_ICON_SUFFIX.test(name))
    .toSorted((first, second) => first.localeCompare(second))
    .map((name) => ({
      name: `antdv-next:${name}`,
      library: 'antdv-next' as const,
    }));
}

let iconCatalogPromise: Promise<IconCatalogItem[]> | null = null;

export function loadSupportedIconCatalog(): Promise<IconCatalogItem[]> {
  if (iconCatalogPromise) {
    return iconCatalogPromise;
  }

  iconCatalogPromise = Promise.all([
    ...ICONIFY_LIBRARIES.map(async (prefix) => {
      const iconsJson = await loadLocalIconifySet(prefix);
      return getIconifyItems(prefix, iconsJson);
    }),
    loadAntdvItems(),
  ]).then((groups) => groups.flat());

  return iconCatalogPromise;
}
