import type { Permission } from '@/types/auth';

import { describe, expect, it } from 'vitest';

import { mockPermissions } from '../../mock/data/permissions.data';
import { mockRoles } from '../../mock/data/roles.data';
import { adminUser, mockUsers, regularUser } from '../../mock/data/users.data';
import {
  deleteMockPermission,
  permissionStore,
  resolveUserPermissions,
} from '../../mock/handlers/permission.mock';
import {
  deleteMockRole,
  isRoleBoundToUser,
  normalizeRolePermissions,
  validateRolePermissions,
} from '../../mock/handlers/role.mock';

function roleByCode(code: string) {
  const role = mockRoles.find((item) => item.code === code);
  if (!role) {
    throw new Error(`Missing mock role: ${code}`);
  }
  return role;
}

/** 与真实后端一致：超级管理员操作者层级为 101，仅低于 super_admin 角色本身。 */
const SUPER_ADMIN_LEVEL = 101;

describe('mock rbac contract', () => {
  it('keeps every role permission flat and unshared', () => {
    for (const role of mockRoles) {
      for (const permission of role.permissions) {
        expect('children' in permission).toBe(false);
      }
    }

    const adminDashboard = roleByCode('admin').permissions.find(
      (permission) => permission.code === 'dashboard.view',
    );
    const managerDashboard = roleByCode('manager').permissions.find(
      (permission) => permission.code === 'dashboard.view',
    );
    expect(adminDashboard).toBeDefined();
    expect(managerDashboard).toBeDefined();
    expect(adminDashboard).not.toBe(managerDashboard);
  });

  it('normalizes valid role permissions to flat minimal objects', () => {
    const permissions = normalizeRolePermissions([
      { code: 'dashboard.view' },
      { code: 'system.user.view' },
    ]);

    expect(permissions.map((permission) => permission.code)).toEqual([
      'dashboard.view',
      'system.user.view',
    ]);
    for (const permission of permissions) {
      expect('children' in permission).toBe(false);
    }
  });

  it('rejects invalid role permission payloads as 400 / 10001', () => {
    for (const input of [
      undefined,
      'dashboard.view',
      [{ code: '' }],
      [{ code: '*' }],
      [{ code: 'unknown.permission' }],
      [{ code: 'dashboard.view' }, { code: 'dashboard.view' }],
    ]) {
      const failure = validateRolePermissions(input);
      expect(failure?.status).toBe(400);
      expect(failure?.code).toBe(10001);
    }

    expect(validateRolePermissions([{ code: 'dashboard.view' }])).toBeNull();
  });

  it('protects every built-in role from a same-level operator', () => {
    // 层级语义：操作者必须严格高于目标角色；同层或更高层的角色一律受保护。
    for (const code of ['super_admin', 'admin', 'manager', 'user', 'guest']) {
      const role = roleByCode(code);
      const outcome = deleteMockRole(role.id, role.level);
      expect(outcome.ok).toBe(false);
      if (!outcome.ok) {
        expect(outcome.status).toBe(403);
        expect(outcome.code).toBe(10007);
      }
      expect(mockRoles.some((item) => item.id === role.id)).toBe(true);
    }
  });

  it('never deletes the super administrator role even for a super operator', () => {
    const role = roleByCode('super_admin');
    const outcome = deleteMockRole(role.id, SUPER_ADMIN_LEVEL);
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.status).toBe(403);
      expect(outcome.code).toBe(10007);
    }
    expect(mockRoles.some((item) => item.id === role.id)).toBe(true);
  });

  it('rejects deleting roles that are still assigned to users', () => {
    expect(isRoleBoundToUser(roleByCode('user'))).toBe(true);
    expect(isRoleBoundToUser(roleByCode('admin'))).toBe(true);

    const customRole = {
      ...roleByCode('guest'),
      id: 'bound-role',
      code: 'bound_role',
      permissions: [],
    };
    expect(isRoleBoundToUser(customRole)).toBe(false);
  });

  it('rejects deleting custom roles that are assigned to users', () => {
    const created = {
      ...roleByCode('guest'),
      id: 'assigned-role',
      code: 'assigned_role',
      permissions: [],
    };
    const owner = {
      ...regularUser,
      id: 'assigned-owner',
      username: 'assigned_owner',
      roles: [created],
    };

    mockRoles.push(created);
    mockUsers.push(owner);

    try {
      expect(isRoleBoundToUser(created)).toBe(true);
      const outcome = deleteMockRole(created.id, SUPER_ADMIN_LEVEL);
      expect(outcome.ok).toBe(false);
      if (!outcome.ok) {
        expect(outcome.status).toBe(409);
        expect(outcome.code).toBe(10006);
      }
      expect(mockRoles.some((item) => item.id === created.id)).toBe(true);
    } finally {
      const userIndex = mockUsers.findIndex((item) => item.id === owner.id);
      if (userIndex !== -1) {
        mockUsers.splice(userIndex, 1);
      }
      const roleIndex = mockRoles.findIndex((item) => item.id === created.id);
      if (roleIndex !== -1) {
        mockRoles.splice(roleIndex, 1);
      }
    }
  });

  it('deletes unbound custom roles and reports missing roles with 404', () => {
    const created = {
      ...roleByCode('guest'),
      id: 'temporary-role',
      code: 'temporary_role',
      permissions: [],
    };
    mockRoles.push(created);

    try {
      const outcome = deleteMockRole(created.id, SUPER_ADMIN_LEVEL);
      expect(outcome.ok).toBe(true);
      expect(mockRoles.some((item) => item.id === created.id)).toBe(false);
    } finally {
      const index = mockRoles.findIndex((item) => item.id === created.id);
      if (index !== -1) {
        mockRoles.splice(index, 1);
      }
    }

    const missing = deleteMockRole('missing-role', SUPER_ADMIN_LEVEL);
    expect(missing.ok).toBe(false);
    if (!missing.ok) {
      expect(missing.status).toBe(404);
      expect(missing.code).toBe(10002);
    }
  });

  it('protects permissions that have children or are referenced by roles', () => {
    const withChildren = permissionStore.find((permission) => permission.id === '60');
    expect(withChildren?.children?.length).toBeGreaterThan(0);

    const childOutcome = deleteMockPermission('60');
    expect(childOutcome.ok).toBe(false);
    if (!childOutcome.ok) {
      expect(childOutcome.status).toBe(409);
      expect(childOutcome.code).toBe(10006);
    }

    const referencedOutcome = deleteMockPermission('1');
    expect(referencedOutcome.ok).toBe(false);
    if (!referencedOutcome.ok) {
      expect(referencedOutcome.status).toBe(409);
      expect(referencedOutcome.code).toBe(10006);
    }
  });

  it('deletes unreferenced permissions and reports missing permissions with 404', () => {
    const temporary: Permission = {
      id: 'temporary-permission',
      name: 'Temporary Permission',
      code: 'temporary.permission',
      description: '',
      resource: 'temporary',
      action: '*',
      type: 'api',
    };
    permissionStore.push(temporary);

    try {
      const outcome = deleteMockPermission(temporary.id);
      expect(outcome.ok).toBe(true);
      expect(permissionStore.some((permission) => permission.id === temporary.id)).toBe(false);
    } finally {
      const index = permissionStore.findIndex((permission) => permission.id === temporary.id);
      if (index !== -1) {
        permissionStore.splice(index, 1);
      }
    }

    const missing = deleteMockPermission('missing-permission');
    expect(missing.ok).toBe(false);
    if (!missing.ok) {
      expect(missing.status).toBe(404);
      expect(missing.code).toBe(10002);
    }
  });

  it('aggregates user permissions from role definitions without children', () => {
    expect(mockUsers[0]?.id).toBe(adminUser.id);
    expect(mockUsers[1]?.id).toBe(regularUser.id);

    const userPermissions = resolveUserPermissions(regularUser.id);
    expect(userPermissions?.map((permission) => permission.code)).toEqual([
      'dashboard.view',
      'organization.menu',
      'system.user.view',
    ]);
    for (const permission of userPermissions ?? []) {
      expect('children' in permission).toBe(false);
    }

    const adminPermissions = resolveUserPermissions(adminUser.id);
    expect(adminPermissions?.map((permission) => permission.code)).toEqual(['*']);
  });

  it('reflects in-memory role permission changes in user aggregation', () => {
    const userRole = roleByCode('user');
    const original = [...userRole.permissions];

    try {
      userRole.permissions.push({
        id: '999',
        name: 'View Config',
        code: 'system.config.view',
        description: '',
        resource: '/system/config',
        action: 'view',
        type: 'menu',
      });

      const permissions = resolveUserPermissions(regularUser.id);
      expect(permissions?.map((permission) => permission.code)).toContain('system.config.view');
    } finally {
      userRole.permissions.splice(0, userRole.permissions.length, ...original);
    }
  });

  it('never surfaces children from the source permission tree', () => {
    const sourceHasChildren = mockPermissions.some(
      (permission) => (permission.children?.length ?? 0) > 0,
    );
    expect(sourceHasChildren).toBe(true);

    const userPermissions = resolveUserPermissions(regularUser.id) ?? [];
    expect(JSON.stringify(userPermissions)).not.toContain('"children"');
  });
});
