import type { Permission, Role } from '@/types/auth';

import { mockPermissions } from './permissions.data';

const ALL_PERMISSION = '*';

export function flattenPermissions(nodes: Permission[]): Permission[] {
  return nodes.flatMap((node) => [node, ...flattenPermissions(node.children ?? [])]);
}

export function cloneFlatPermission(permission: Permission): Permission {
  const clone = structuredClone(permission);
  delete clone.children;
  return clone;
}

function clonePermissions(predicate: (permission: Permission) => boolean): Permission[] {
  return flattenPermissions(mockPermissions)
    .filter(predicate)
    .map((permission) => cloneFlatPermission(permission));
}

export function wildcardPermission(): Permission {
  return {
    id: ALL_PERMISSION,
    name: {
      'zh-CN': '全部权限',
      'en-US': 'All Permissions',
      'ja-JP': 'すべての権限',
      'ko-KR': '모든 권한',
    },
    code: ALL_PERMISSION,
    description: '超级管理员全部权限',
    resource: ALL_PERMISSION,
    action: ALL_PERMISSION,
    type: 'api',
  };
}

const adminPermissions = clonePermissions(() => true);
const managerPermissions = clonePermissions(
  ({ code }) =>
    code === 'dashboard.view' ||
    code === 'organization.menu' ||
    code.startsWith('system.user.') ||
    code === 'system.role.view',
);
const userPermissions = clonePermissions(({ code }) =>
  ['dashboard.view', 'organization.menu', 'system.user.view'].includes(code),
);
const guestPermissions = clonePermissions(({ code }) => code === 'dashboard.view');

export const mockRoles: Role[] = [
  {
    id: '1',
    name: 'Administrator',
    code: 'admin',
    description: 'Administrator with every defined permission (no wildcard)',
    level: 90,
    permissions: adminPermissions,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    name: 'Manager',
    code: 'manager',
    description: 'Manager with management permissions',
    level: 70,
    permissions: managerPermissions,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  },
  {
    id: '3',
    name: 'User',
    code: 'user',
    description: 'Regular user with basic permissions',
    level: 50,
    permissions: userPermissions,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  },
  {
    id: '4',
    name: 'Guest',
    code: 'guest',
    description: 'Guest user with read-only access',
    level: 10,
    permissions: guestPermissions,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  },
  {
    id: '5',
    name: 'Super Administrator',
    code: 'super_admin',
    description: 'Super administrator with the * wildcard permission; bootstrap-only and protected',
    level: 100,
    permissions: [wildcardPermission()],
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  },
];
