import type { Plugin } from 'vite';

import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

interface IconSet {
  prefix: string;
  icons: Record<string, unknown>;
  aliases?: Record<string, { parent: string }>;
  width?: number;
  height?: number;
}

// Keep the catalog searchable without downloading SVG bodies. Adjacent names
// share a small chunk, so a page of icons reuses downloads instead of one per SVG.
export function iconAssets(): Plugin {
  const require = createRequire(import.meta.url);
  const modules = new Map<string, string>();
  let isBuild = false;

  function prepare(): void {
    if (modules.size) return;
    const catalog: Record<string, string[]> = {};
    const loaders: string[] = [];

    for (const prefix of ['ri', 'mdi', 'ion']) {
      const set: IconSet = JSON.parse(
        readFileSync(require.resolve(`@iconify-json/${prefix}/icons.json`), 'utf8'),
      );
      const names = [
        ...new Set([...Object.keys(set.icons), ...Object.keys(set.aliases ?? {})]),
      ].sort();
      catalog[prefix] = names;
      const prefixLoaders: string[] = [];
      for (let offset = 0; offset < names.length; offset += 64) {
        const namesInGroup = names.slice(offset, offset + 64);
        const subset: IconSet = {
          prefix,
          width: set.width,
          height: set.height,
          icons: {},
          aliases: {},
        };
        function include(name: string): void {
          if (Object.hasOwn(subset.icons, name) || Object.hasOwn(subset.aliases!, name)) return;
          if (Object.hasOwn(set.icons, name)) {
            subset.icons[name] = set.icons[name];
          } else if (set.aliases?.[name]) {
            subset.aliases![name] = set.aliases[name];
            include(set.aliases[name].parent);
          } else {
            throw new Error(`Missing icon alias parent: ${prefix}:${name}`);
          }
        }
        namesInGroup.forEach(include);
        const id = `virtual:icon-data/${prefix}/${offset / 64}`;
        modules.set(id, `export default ${JSON.stringify(subset)};`);
        prefixLoaders.push(
          `{last: ${JSON.stringify(namesInGroup.at(-1))}, load: () => import(${JSON.stringify(id)})}`,
        );
      }
      loaders.push(`${JSON.stringify(prefix)}: [${prefixLoaders.join(',')}]`);
    }

    const iconRoot = dirname(require.resolve('@antdv-next/icons/package.json'));
    const antdvLoaders: string[] = [];
    catalog['antdv-next'] = [];
    for (const folder of ['icons', 'extra-icons']) {
      for (const file of readdirSync(join(iconRoot, 'dist', folder)).sort()) {
        if (!/(Outlined|Filled|TwoTone)\.js$/.test(file)) continue;
        const name = file.slice(0, -3);
        catalog['antdv-next'].push(name);
        antdvLoaders.push(
          `${JSON.stringify(name)}: () => import(${JSON.stringify(`@antdv-next/icons/${folder}/${name}`)})`,
        );
      }
    }
    modules.set('virtual:icon-catalog', `export default ${JSON.stringify(catalog)};`);
    modules.set('virtual:iconify-loaders', `export default {${loaders.join(',')}};`);
    modules.set(
      'virtual:antdv-icon-loaders',
      isBuild
        ? `export default {${antdvLoaders.join(',')}};`
        : // The app already imports this entry in dev. Reuse it instead of asking
          // Vite to discover and optimize hundreds of individual icon entries.
          `const names = ${JSON.stringify(catalog['antdv-next'])};
export default Object.fromEntries(names.map(name => [name, async () => ({
  default: (await import('@antdv-next/icons'))[name]
})]));`,
    );
  }

  return {
    name: 'local-icon-assets',
    configResolved(config) {
      isBuild = config.command === 'build';
    },
    resolveId(id) {
      if (id.startsWith('virtual:icon') || id === 'virtual:antdv-icon-loaders') {
        prepare();
        if (modules.has(id)) return `\0${id}`;
      }
    },
    load(id) {
      return modules.get(id.replace(/^\0/, ''));
    },
  };
}
