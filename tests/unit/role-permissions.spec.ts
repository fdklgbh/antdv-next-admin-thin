import type { Permission } from '@/types/auth';

import { describe, expect, it } from 'vitest';

import { mockPermissions } from '../../mock/data/permissions.data';
import { mockRoles } from '../../mock/data/roles.data';

function flattenPermissions(nodes: Permission[]): Permission[] {
  return nodes.flatMap((node) => [node, ...flattenPermissions(node.children ?? [])]);
}

describe('mock role permissions', () => {
  const rolesByCode = new Map(mockRoles.map((role) => [role.code, role]));
  const allPermissions = flattenPermissions(mockPermissions);

  it('assigns every permission to the administrator', () => {
    expect(rolesByCode.get('admin')?.permissions).toHaveLength(allPermissions.length);
  });

  it('assigns progressively narrower permission sets to non-admin roles', () => {
    const managerCodes = rolesByCode.get('manager')?.permissions.map((item) => item.code) ?? [];
    const userCodes = rolesByCode.get('user')?.permissions.map((item) => item.code) ?? [];
    const guestCodes = rolesByCode.get('guest')?.permissions.map((item) => item.code) ?? [];

    expect(managerCodes).toEqual([
      'dashboard.view',
      'organization.menu',
      'system.user.view',
      'system.user.create',
      'system.user.edit',
      'system.user.delete',
      'system.role.view',
    ]);
    expect(userCodes).toEqual(['dashboard.view', 'organization.menu', 'system.user.view']);
    expect(guestCodes).toEqual(['dashboard.view']);
  });

  it('keeps permission ids unique and does not share source objects', () => {
    for (const role of mockRoles) {
      const ids = role.permissions.map((permission) => permission.id);
      expect(new Set(ids).size).toBe(ids.length);
    }

    const adminDashboard = rolesByCode
      .get('admin')
      ?.permissions.find((permission) => permission.code === 'dashboard.view');
    const sourceDashboard = allPermissions.find(
      (permission) => permission.code === 'dashboard.view',
    );
    expect(adminDashboard).not.toBe(sourceDashboard);
  });

  it('keeps role permission lists flat without children', () => {
    for (const role of mockRoles) {
      for (const permission of role.permissions) {
        expect(permission.children).toBeUndefined();
        expect(Object.prototype.hasOwnProperty.call(permission, 'children')).toBe(false);
      }
    }
  });

  it('does not share permission object references between roles', () => {
    const permissionsByCode = new Map<string, Permission[]>();
    for (const role of mockRoles) {
      for (const permission of role.permissions) {
        const owners = permissionsByCode.get(permission.code) ?? [];
        owners.push(permission);
        permissionsByCode.set(permission.code, owners);
      }
    }

    for (const owners of permissionsByCode.values()) {
      for (let index = 1; index < owners.length; index += 1) {
        expect(owners[index]).not.toBe(owners[0]);
      }
    }
  });

  it('keeps role codes unique', () => {
    const codes = mockRoles.map((role) => role.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('gives the super administrator only the * wildcard', () => {
    const superAdmin = rolesByCode.get('super_admin');
    expect(superAdmin?.permissions.map((permission) => permission.code)).toEqual(['*']);
  });
});
