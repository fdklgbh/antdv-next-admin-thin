import { describe, expect, it } from 'vitest';

import {
  actorLevelFromToken,
  canManageRole,
  validateRoleLevel,
} from '../../mock/handlers/role.mock';

describe('mock role level enforcement', () => {
  describe('actorLevelFromToken', () => {
    it('derives the admin mock user level from the bound admin role (90)', () => {
      // 与真实后端一致：admin 角色的 level 为 90，仅 super_admin 角色才是 101。
      expect(actorLevelFromToken('Bearer mock-token-1-9999999999999')).toBe(90);
    });

    it('derives the level from the user role for a regular user', () => {
      expect(actorLevelFromToken('Bearer mock-token-2-9999999999999')).toBe(50);
    });

    it('returns 0 for a missing or unknown token', () => {
      expect(actorLevelFromToken(undefined)).toBe(0);
      expect(actorLevelFromToken('Bearer mock-token-unknown-1')).toBe(0);
    });
  });

  describe('canManageRole', () => {
    it('never manages the super administrator role', () => {
      expect(canManageRole(101, 'super_admin', 100)).toBe(false);
    });

    it('rejects the same or a higher level and allows a lower level', () => {
      expect(canManageRole(90, 'admin', 90)).toBe(false);
      expect(canManageRole(90, 'manager', 100)).toBe(false);
      expect(canManageRole(90, 'manager', 70)).toBe(true);
    });
  });

  describe('validateRoleLevel', () => {
    it('rejects a level outside 0~99 as 400 / 10001', () => {
      for (const level of [-1, 100, 1.5, 'abc']) {
        const failure = validateRoleLevel('custom_role', level, 101, true);
        expect(failure?.status).toBe(400);
        expect(failure?.code).toBe(10001);
      }
    });

    it('rejects creating a role that reuses a built-in role code', () => {
      for (const code of ['super_admin', 'admin', 'manager', 'user', 'guest']) {
        const failure = validateRoleLevel(code, 10, 101, true);
        expect(failure?.status).toBe(403);
        expect(failure?.code).toBe(10007);
      }
    });

    it('rejects creating a role at the same or a higher level than the operator', () => {
      expect(validateRoleLevel('custom_role', 90, 90, true)?.code).toBe(10007);
      expect(validateRoleLevel('custom_role', 99, 90, true)?.code).toBe(10007);
    });

    it('allows creating a role strictly below the operator', () => {
      expect(validateRoleLevel('custom_role', 10, 90, true)).toBeNull();
      expect(validateRoleLevel('custom_role', 0, 10, true)).toBeNull();
    });

    it('allows updating a role code that is built-in when only the level is validated', () => {
      // 更新场景不再校验内置码（内置码由保存流程的 code 不可变更规则守住）。
      expect(validateRoleLevel('admin', 70, 90, false)).toBeNull();
    });

    it('rejects updating a role to the same or a higher level', () => {
      expect(validateRoleLevel('custom_role', 90, 90, false)?.code).toBe(10007);
      expect(validateRoleLevel('custom_role', 95, 90, false)?.code).toBe(10007);
    });
  });
});
