import type { AppRouteRecordRaw, MenuItem } from '@/types/router';

function resolveRoutePath(path: string, basePath = ''): string {
  if (!path) {
    return basePath || '/';
  }

  if (path.startsWith('/')) {
    return path;
  }

  const normalizedBase = basePath === '/' ? '' : basePath.replace(/\/$/, '');
  const resolved = `${normalizedBase}/${path}`.replace(/\/+/g, '/');
  return resolved.startsWith('/') ? resolved : `/${resolved}`;
}

/**
 * Convert routes to menu tree
 */
export function routesToMenuTree(routes: AppRouteRecordRaw[], basePath = ''): MenuItem[] {
  return routes
    .filter((route) => !route.meta?.hidden)
    .map((route) => {
      const fullPath = resolveRoutePath(route.path, basePath);
      const menu: MenuItem = {
        id: (route.name as string) || route.path,
        label: route.meta?.title || (route.name as string),
        icon: route.meta?.icon,
        // Allow routes to render as external links in the sidebar menu.
        // Sidebar click handler will open these in a new browser tab.
        path:
          ((route.meta as unknown as Record<string, unknown>)?.externalLink as string) || fullPath,
        badge: route.meta?.badge,
        meta: route.meta,
      };

      if (route.children && route.children.length > 0) {
        menu.children = routesToMenuTree(route.children, fullPath);
      }

      return menu;
    })
    .toSorted((a, b) => {
      const orderA = a.meta?.order || 999;
      const orderB = b.meta?.order || 999;
      return orderA - orderB;
    });
}
