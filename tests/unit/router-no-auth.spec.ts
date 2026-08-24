import { describe, expect, it } from 'vitest';

import { basicRoutes, staticRoutes } from '@/router/routes';
import type { AppRouteRecordRaw } from '@/types/router';

function flattenRoutes(routes: AppRouteRecordRaw[]): AppRouteRecordRaw[] {
  return routes.flatMap((route) => [
    route,
    ...(route.children ? flattenRoutes(route.children) : []),
  ]);
}

describe('no-auth route definitions', () => {
  it('does not expose login or permission routes', () => {
    const routes = flattenRoutes([...staticRoutes, ...basicRoutes]);

    expect(routes.some((route) => route.name === 'Login')).toBe(false);
    expect(routes.some((route) => route.name === 'Forbidden')).toBe(false);
    expect(routes.some((route) => route.path.endsWith('/role'))).toBe(false);
    expect(routes.some((route) => route.path.endsWith('/permission'))).toBe(false);
  });
});
