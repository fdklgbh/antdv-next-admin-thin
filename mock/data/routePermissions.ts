import { mockRoles } from './roles.data';
import { mockUsers } from './users.data';

/**
 * Mock 侧的路由权限表，与真实后端 `route_permissions` 迁移数据保持同源。
 * 未列出的路由不做权限校验（例如 /api/auth/*、/api/permissions/user）。
 */
export const ROUTE_PERMISSIONS: Record<string, string> = {
  'GET /api/roles': 'system.role.view',
  'GET /api/roles/options': 'system.user.view',
  'POST /api/roles': 'system.role.create',
  'PUT /api/roles/:id': 'system.role.edit',
  'DELETE /api/roles/:id': 'system.role.delete',
  'GET /api/permissions': 'system.permission.view',
  'GET /api/permissions/tree': 'system.role.view',
  'POST /api/permissions': 'system.permission.create',
  'PUT /api/permissions/:id': 'system.permission.edit',
  'DELETE /api/permissions/:id': 'system.permission.delete',
};

export const ALL_PERMISSION = '*';

export interface RouteAuthorizationDenied {
  ok: false;
  status: number;
  code: number;
  message: string;
}

export type RouteAuthorization = { ok: true } | RouteAuthorizationDenied;

const UNAUTHENTICATED: RouteAuthorizationDenied = {
  status: 401,
  code: 20001,
  message: '登录状态已失效，请重新登录',
};

const PERMISSION_DENIED: RouteAuthorizationDenied = {
  status: 403,
  code: 20002,
  message: '没有访问权限',
};

export function resolveTokenUserId(raw?: string): string | undefined {
  const token = raw?.replace('Bearer ', '');
  const match = /^mock-token-(.+)-\d+$/.exec(token ?? '');
  return match?.[1];
}

/** 解析 token 对应用户的权限集合；拥有 `*` 的角色与 admin 用户返回 `['*']`，未知用户返回 null。 */
export function resolveEffectivePermissionCodes(userId: string): string[] | null {
  const user = mockUsers.find((item) => item.id === userId);
  if (!user) {
    return null;
  }

  const roles = user.roles
    .map(
      (userRole) =>
        mockRoles.find((role) => role.code === userRole.code) ??
        mockRoles.find((role) => role.id === userRole.id),
    )
    .filter((role) => Boolean(role));

  const codes = new Set<string>();
  let wildcard = user.username === 'admin';
  for (const role of roles) {
    for (const permission of role.permissions) {
      if (permission.code === ALL_PERMISSION) {
        wildcard = true;
        continue;
      }
      codes.add(permission.code);
    }
  }

  return wildcard ? [ALL_PERMISSION] : [...codes];
}

/**
 * 校验请求是否具备访问该路由的权限：未配置权限要求的路由直接放行，
 * 未认证返回 401 / 20001，无权限返回 403 / 20002。
 */
export function authorizeRoute(
  routeKey: string,
  authorizationHeader?: string,
): RouteAuthorization {
  const requiredCode = ROUTE_PERMISSIONS[routeKey];
  if (!requiredCode) {
    return { ok: true };
  }

  const userId = resolveTokenUserId(authorizationHeader);
  if (!userId) {
    return UNAUTHENTICATED;
  }

  const permissionCodes = resolveEffectivePermissionCodes(userId);
  if (!permissionCodes) {
    return UNAUTHENTICATED;
  }

  if (permissionCodes.includes(ALL_PERMISSION) || permissionCodes.includes(requiredCode)) {
    return { ok: true };
  }

  return PERMISSION_DENIED;
}