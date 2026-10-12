import type { Permission, Role } from '@/types/auth';
import type { MockResponse } from 'vite-plugin-mock-dev-server';

import { faker } from '@faker-js/faker';
import { defineMock } from 'vite-plugin-mock-dev-server';

import { mockPermissions } from '../data/permissions.data';
import {
  cloneFlatPermission,
  flattenPermissions,
  mockRoles,
  wildcardPermission,
} from '../data/roles.data';
import { mockUsers } from '../data/users.data';
import { authorizeRoute, resolveTokenUserId } from '../data/routePermissions';

const ALL_PERMISSION = '*';

export const permissionStore: Permission[] = structuredClone(mockPermissions);

const permissionDefinitions = flattenPermissions(mockPermissions);
const permissionByCode = new Map(
  permissionDefinitions.map((permission) => [permission.code, permission]),
);

export interface MockFailure {
  status: number;
  code: number;
  message: string;
}

export type DeletePermissionOutcome = { ok: true } | ({ ok: false } & MockFailure);

function sendJson(res: MockResponse, status: number, body: Record<string, unknown>): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function success(res: MockResponse, data: unknown, message = 'Success'): void {
  sendJson(res, 200, { code: 0, message, data, success: true });
}

function fail(res: MockResponse, status: number, code: number, message: string): void {
  sendJson(res, status, { code, message, data: null, success: false });
}

function getPermissionNameText(name: Permission['name']): string {
  if (typeof name === 'string') {
    return name;
  }

  return Object.values(name).join(' ');
}

function findPermissionById(
  permissions: Permission[],
  id: string,
  parent: Permission | null = null,
): { permission: Permission | null; parent: Permission | null } {
  for (const permission of permissions) {
    if (permission.id === id) {
      return { permission, parent };
    }

    if (permission.children && permission.children.length > 0) {
      const result = findPermissionById(permission.children, id, permission);
      if (result.permission) {
        return result;
      }
    }
  }

  return { permission: null, parent: null };
}

function findPermissionByCode(permissions: Permission[], code: string): Permission | null {
  for (const permission of permissions) {
    if (permission.code === code) {
      return permission;
    }

    if (permission.children && permission.children.length > 0) {
      const found = findPermissionByCode(permission.children, code);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

function removePermissionById(permissions: Permission[], id: string): boolean {
  const index = permissions.findIndex((permission) => permission.id === id);
  if (index !== -1) {
    permissions.splice(index, 1);
    return true;
  }

  return permissions.some((permission) => {
    if (!permission.children || permission.children.length === 0) {
      return false;
    }

    const removed = removePermissionById(permission.children, id);
    if (removed && permission.children.length === 0) {
      delete permission.children;
    }
    return removed;
  });
}

function appendPermission(
  permissions: Permission[],
  permission: Permission,
  parentId?: string,
): boolean {
  if (!parentId) {
    permissions.push(permission);
    return true;
  }

  const { permission: parentPermission } = findPermissionById(permissions, parentId);
  if (!parentPermission) {
    return false;
  }

  if (!parentPermission.children) {
    parentPermission.children = [];
  }
  parentPermission.children.push(permission);
  return true;
}

function filterPermissionTree(
  permissions: Permission[],
  keyword?: string,
  type?: string,
  status?: string,
): Permission[] {
  const normalizedKeyword = keyword?.toLowerCase().trim();

  return permissions.reduce<Permission[]>((result, permission) => {
    const children = permission.children
      ? filterPermissionTree(permission.children, keyword, type, status)
      : [];

    const matchedKeyword =
      !normalizedKeyword ||
      getPermissionNameText(permission.name).toLowerCase().includes(normalizedKeyword) ||
      String(permission.code || '')
        .toLowerCase()
        .includes(normalizedKeyword) ||
      (permission.path || '').toLowerCase().includes(normalizedKeyword);

    const matchedType = !type || permission.type === type;
    const matchedStatus = !status || (permission.status || 'active') === status;
    const matchedSelf = matchedKeyword && matchedType && matchedStatus;

    if (matchedSelf || children.length > 0) {
      result.push({
        ...permission,
        children: children.length > 0 ? children : undefined,
      });
    }

    return result;
  }, []);
}

function normalizeQueryValue(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return normalizeQueryValue(value[0]);
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function roleReferencesPermission(permission: Permission): boolean {
  return mockRoles.some((role) => role.permissions.some((item) => item.code === permission.code));
}

export function resolveUserPermissions(userId: string): Permission[] | null {
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
    .filter((role): role is Role => Boolean(role));

  const hasWildcard =
    user.username === 'admin' ||
    roles.some((role) => role.permissions.some((item) => item.code === ALL_PERMISSION));

  if (hasWildcard) {
    return [wildcardPermission()];
  }

  const seen = new Set<string>();
  const permissions: Permission[] = [];

  for (const role of roles) {
    for (const permission of role.permissions) {
      if (permission.code === ALL_PERMISSION || seen.has(permission.code)) {
        continue;
      }

      seen.add(permission.code);
      const latest = findPermissionByCode(permissionStore, permission.code);
      permissions.push(cloneFlatPermission(latest ?? permission));
    }
  }

  permissions.sort((left, right) => left.code.localeCompare(right.code));
  return permissions;
}

export function deleteMockPermission(id: string): DeletePermissionOutcome {
  const { permission } = findPermissionById(permissionStore, id);

  if (!permission) {
    return { ok: false, status: 404, code: 10002, message: 'Permission not found' };
  }

  if (permission.children && permission.children.length > 0) {
    return {
      ok: false,
      status: 409,
      code: 10006,
      message: 'Permission still has child permissions',
    };
  }

  if (roleReferencesPermission(permission)) {
    return {
      ok: false,
      status: 409,
      code: 10006,
      message: 'Permission is still referenced by roles',
    };
  }

  const removed = removePermissionById(permissionStore, permission.id);
  if (!removed) {
    return { ok: false, status: 404, code: 10002, message: 'Permission not found' };
  }

  return { ok: true };
}

export default defineMock([
  // Get permission list (tree structure)
  {
    url: '/api/permissions',
    method: 'GET',
    response: (req, res) => {
      const authorization = authorizeRoute('GET /api/permissions', req.headers.authorization);
      if (!authorization.ok) {
        fail(res, authorization.status, authorization.code, authorization.message);
        return;
      }

      const query = req.query || {};
      const keyword = normalizeQueryValue(query.keyword);
      const type = normalizeQueryValue(query.type);
      const status = normalizeQueryValue(query.status);
      const filtered = filterPermissionTree(permissionStore, keyword, type, status);

      success(res, filtered);
    },
  },

  // Get permission tree (for menu)
  {
    url: '/api/permissions/tree',
    method: 'GET',
    response: (req, res) => {
      const authorization = authorizeRoute('GET /api/permissions/tree', req.headers.authorization);
      if (!authorization.ok) {
        fail(res, authorization.status, authorization.code, authorization.message);
        return;
      }

      success(res, permissionStore);
    },
  },

  // Get permission by ID
  {
    url: '/api/permissions/:id',
    method: 'GET',
    response: (req, res) => {
      const authorization = authorizeRoute('GET /api/permissions/:id', req.headers.authorization);
      if (!authorization.ok) {
        fail(res, authorization.status, authorization.code, authorization.message);
        return;
      }

      const { permission } = findPermissionById(permissionStore, req.params.id);

      if (!permission) {
        fail(res, 404, 10002, 'Permission not found');
        return;
      }

      success(res, permission);
    },
  },

  // Create permission
  {
    url: '/api/permissions',
    method: 'POST',
    response: (req, res) => {
      const authorization = authorizeRoute('POST /api/permissions', req.headers.authorization);
      if (!authorization.ok) {
        fail(res, authorization.status, authorization.code, authorization.message);
        return;
      }

      const payload = req.body || {};
      const code = normalizeQueryValue(payload.code);
      const parentId = normalizeQueryValue(payload.parentId);

      if (!code || code === ALL_PERMISSION || !/^[a-zA-Z0-9_.-]+$/.test(code)) {
        fail(res, 400, 10001, 'Invalid permission code');
        return;
      }

      if (permissionByCode.has(code) || findPermissionByCode(permissionStore, code)) {
        fail(res, 409, 10006, 'Permission code already exists');
        return;
      }

      if (parentId && !findPermissionById(permissionStore, parentId).permission) {
        fail(res, 400, 10001, 'Parent permission not found');
        return;
      }

      const permission: Permission = {
        id: faker.string.uuid(),
        name: payload.name,
        code,
        description: payload.description || '',
        resource: payload.resource || payload.path || code,
        action: payload.action || (payload.type === 'menu' ? 'view' : ALL_PERMISSION),
        type: payload.type || 'menu',
        parentId,
        path: payload.path,
        component: payload.component,
        icon: payload.icon,
        sort: payload.sort ?? 0,
        status: payload.status || 'active',
        visible: payload.visible ?? true,
      };

      const appended = appendPermission(permissionStore, permission, parentId);
      if (!appended) {
        fail(res, 400, 10001, 'Parent permission not found');
        return;
      }

      success(res, permission, 'Permission created successfully');
    },
  },

  // Update permission
  {
    url: '/api/permissions/:id',
    method: 'PUT',
    response: (req, res) => {
      const authorization = authorizeRoute('PUT /api/permissions/:id', req.headers.authorization);
      if (!authorization.ok) {
        fail(res, authorization.status, authorization.code, authorization.message);
        return;
      }

      const payload = req.body || {};
      const { permission, parent } = findPermissionById(permissionStore, req.params.id);

      if (!permission) {
        fail(res, 404, 10002, 'Permission not found');
        return;
      }

      const nextParentId = normalizeQueryValue(payload.parentId);
      if (nextParentId !== undefined && nextParentId !== permission.parentId) {
        if (!findPermissionById(permissionStore, nextParentId).permission) {
          fail(res, 400, 10001, 'Parent permission not found');
          return;
        }

        const movedPermission = structuredClone(permission);
        removePermissionById(permissionStore, permission.id);
        movedPermission.parentId = nextParentId;
        const appended = appendPermission(permissionStore, movedPermission, nextParentId);
        if (!appended) {
          appendPermission(permissionStore, movedPermission, parent?.id);
          fail(res, 400, 10001, 'Parent permission not found');
          return;
        }
      }

      const { permission: nextPermission } = findPermissionById(permissionStore, permission.id);
      if (!nextPermission) {
        fail(res, 404, 10002, 'Permission not found');
        return;
      }

      const children = nextPermission.children;
      Object.assign(nextPermission, payload, { children });

      success(res, nextPermission, 'Permission updated successfully');
    },
  },

  // Delete permission
  {
    url: '/api/permissions/:id',
    method: 'DELETE',
    response: (req, res) => {
      const authorization = authorizeRoute('DELETE /api/permissions/:id', req.headers.authorization);
      if (!authorization.ok) {
        fail(res, authorization.status, authorization.code, authorization.message);
        return;
      }

      const outcome = deleteMockPermission(req.params.id);

      if (!outcome.ok) {
        fail(res, outcome.status, outcome.code, outcome.message);
        return;
      }

      success(res, null, 'Permission deleted successfully');
    },
  },

  // Get permissions for the current token user, aggregated from mockRoles.
  {
    url: '/api/permissions/user',
    method: 'GET',
    response: (req, res) => {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const userId = resolveTokenUserId(token);

      if (!userId) {
        fail(res, 401, 20001, 'Unauthenticated');
        return;
      }

      const permissions = resolveUserPermissions(userId);
      if (!permissions) {
        fail(res, 401, 20001, 'Unauthenticated');
        return;
      }

      success(res, permissions);
    },
  },
]);
