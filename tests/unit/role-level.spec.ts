import type { Role } from '@/types/auth';

import { describe, expect, it } from 'vitest';

import {
  SUPER_ADMIN_CODE,
  canManageRole,
  filterAssignableRoles,
  getHighestRoleLevel,
  isValidRoleLevel,
} from '@/views/system/roleLevel';

function role(code: string, level: number): Pick<Role, 'code' | 'level'> & { name: string; id: string } {
  return { id: code, code, level, name: code };
}

describe('getHighestRoleLevel', () => {
  it('returns 0 when there is no role', () => {
    expect(getHighestRoleLevel(undefined)).toBe(0);
    expect(getHighestRoleLevel(null)).toBe(0);
    expect(getHighestRoleLevel([])).toBe(0);
  });

  it('returns the highest level among roles', () => {
    expect(getHighestRoleLevel([role('user', 50), role('admin', 90), role('guest', 10)])).toBe(90);
  });

  it('treats a missing level as 0', () => {
    expect(getHighestRoleLevel([{ level: undefined } as unknown as Pick<Role, 'level'>])).toBe(0);
  });
});

describe('canManageRole', () => {
  it('never manages the super administrator role, even for a super operator', () => {
    expect(canManageRole(role(SUPER_ADMIN_CODE, 100), 101)).toBe(false);
    expect(canManageRole(role(SUPER_ADMIN_CODE, 100), 100)).toBe(false);
  });

  it('rejects roles at the same level', () => {
    expect(canManageRole(role('manager', 70), 70)).toBe(false);
  });

  it('rejects roles at a higher level', () => {
    expect(canManageRole(role('admin', 90), 70)).toBe(false);
  });

  it('allows roles at a lower level', () => {
    expect(canManageRole(role('manager', 70), 90)).toBe(true);
    expect(canManageRole(role('guest', 10), 70)).toBe(true);
  });

  it('treats a missing level as 0 so any operator can manage it', () => {
    expect(canManageRole({ code: 'custom', level: undefined } as unknown as Pick<Role, 'code' | 'level'>, 10)).toBe(true);
  });
});

describe('filterAssignableRoles', () => {
  const roles = [
    role('super_admin', 100),
    role('admin', 90),
    role('manager', 70),
    role('user', 50),
    role('guest', 10),
  ];

  it('keeps only strictly lower roles for an admin', () => {
    expect(filterAssignableRoles(roles, 90).map((item) => item.code)).toEqual([
      'manager',
      'user',
      'guest',
    ]);
  });

  it('excludes the super administrator role for a super operator', () => {
    expect(filterAssignableRoles(roles, 101).map((item) => item.code)).toEqual([
      'admin',
      'manager',
      'user',
      'guest',
    ]);
  });

  it('keeps nothing when the operator has the lowest level', () => {
    expect(filterAssignableRoles(roles, 10)).toEqual([]);
  });

  it('preserves the original order and object identity', () => {
    const result = filterAssignableRoles(roles, 90);
    expect(result[0]).toBe(roles[2]);
  });
});

describe('isValidRoleLevel', () => {
  it('accepts integers from 0 to 99', () => {
    expect(isValidRoleLevel(0)).toBe(true);
    expect(isValidRoleLevel(50)).toBe(true);
    expect(isValidRoleLevel(99)).toBe(true);
  });

  it('rejects the reserved super administrator level 100', () => {
    expect(isValidRoleLevel(100)).toBe(false);
  });

  it('rejects negative numbers, decimals and non-numeric input', () => {
    expect(isValidRoleLevel(-1)).toBe(false);
    expect(isValidRoleLevel(50.5)).toBe(false);
    expect(isValidRoleLevel('abc')).toBe(false);
    expect(isValidRoleLevel(undefined)).toBe(false);
  });
});
