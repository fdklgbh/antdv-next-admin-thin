import type { Permission, Role } from '@/types/auth';
import type { MockResponse } from 'vite-plugin-mock-dev-server';

import { faker } from '@faker-js/faker';
import { defineMock } from 'vite-plugin-mock-dev-server';

import { mockPermissions } from '../data/permissions.data';
import { cloneFlatPermission, flattenPermissions, mockRoles } from '../data/roles.data';
import { mockUsers } from '../data/users.data';
import { authorizeRoute } from '../data/routePermissions';

const PROTECTED_ROLE_CODES = new Set(['super_admin', 'admin', 'manager', 'user', 'guest']);

/** 内置角色优先级，与真实后端一致：super_admin 独占 100。 */
const MOCK_ROLE_LEVELS: Record<string, number> = {
  super_admin: 100,
  admin: 90,
  manager: 70,
  user: 50,
  guest: 10,
};

/**
 * 解析 mock token 对应操作者的最高层级，规则与真实后端 actorRoleLevel 完全一致：
 *   - 持有 super_admin 角色 → 101（可管理除 super_admin 角色本身外的一切）；
 *   - 其余按所属角色的最高 level 计算；
 *   - 无 token / 未知用户 → 0。
 * 注意：不能按 username === 'admin' 判定为超级操作者，真实后端只认 super_admin 角色。
 */
export function actorLevelFromToken(authorization?: string): number {
  const match = /^mock-token-(.+)-\d+$/.exec(authorization?.replace('Bearer ', '') ?? '');
  const userId = match?.[1];
  if (!userId) return 0;

  const user = mockUsers.find((item) => item.id === userId);
  if (!user) return 0;

  const roles = user.roles
    .map((userRole) => mockRoles.find((role) => role.code === userRole.code))
    .filter((role): role is Role => Boolean(role));

  if (roles.some((role) => role.code === 'super_admin')) {
    return MOCK_ROLE_LEVELS.super_admin + 1;
  }

  return roles.reduce((highest, role) => Math.max(highest, role.level ?? 0), 0);
}

/** 不能管理同级、更高优先级以及超级管理员角色。 */
export function canManageRole(actorLevel: number, code: string, level: number): boolean {
  return code !== 'super_admin' && level < actorLevel;
}

const permissionDefinitions = flattenPermissions(mockPermissions);

const permissionByCode = new Map(
  permissionDefinitions.map((permission) => [permission.code, permission]),
);

export interface MockFailure {
  status: number;
  code: number;
  message: string;
}

export type DeleteRoleOutcome = { ok: true } | ({ ok: false } & MockFailure);

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

function readPermissionCode(value: unknown): string | null {
  if (typeof value !== 'object' || value === null || !('code' in value)) {
    return null;
  }

  const code = value.code;
  if (typeof code !== 'string') {
    return null;
  }

  const trimmed = code.trim();
  return trimmed && trimmed !== '*' ? trimmed : null;
}

export function validateRolePermissions(input: unknown): MockFailure | null {
  if (!Array.isArray(input)) {
    return { status: 400, code: 10001, message: 'Role permissions must be an array' };
  }

  const seen = new Set<string>();
  for (const item of input) {
    const code = readPermissionCode(item);
    if (!code) {
      return { status: 400, code: 10001, message: 'Invalid permission code' };
    }
    if (seen.has(code)) {
      return { status: 400, code: 10001, message: 'Duplicate permission code' };
    }
    if (!permissionByCode.has(code)) {
      return { status: 400, code: 10001, message: `Unknown permission code: ${code}` };
    }
    seen.add(code);
  }

  return null;
}

export function normalizeRolePermissions(input: unknown): Permission[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const codes = new Set<string>();
  for (const item of input) {
    const code = readPermissionCode(item);
    if (code) {
      codes.add(code);
    }
  }

  return [...codes].map((code) => {
    const definition = permissionByCode.get(code);
    if (!definition) {
      throw new Error(`Unknown permission code: ${code}`);
    }
    return cloneFlatPermission(definition);
  });
}

export function isRoleBoundToUser(role: Role): boolean {
  return mockUsers.some((user) =>
    user.roles.some((userRole) => userRole.id === role.id || userRole.code === role.code),
  );
}

/**
 * 校验角色创建/更新的优先级与层级约束，返回失败信息或 null。
 * 规则与真实后端一致：level 必须是 0~99 的整数，且必须低于操作者层级。
 */
export function validateRoleLevel(
  code: string,
  level: unknown,
  actorLevel: number,
  isCreate: boolean,
): MockFailure | null {
  if (!Number.isInteger(Number(level)) || Number(level) < 0 || Number(level) > 99) {
    return { status: 400, code: 10001, message: 'Invalid role level' };
  }
  if (isCreate && PROTECTED_ROLE_CODES.has(code)) {
    return { status: 403, code: 10007, message: 'Protected roles cannot be created' };
  }
  if (!canManageRole(actorLevel, code, Number(level))) {
    return { status: 403, code: 10007, message: 'Protected roles cannot be created at this priority' };
  }
  return null;
}

export function deleteMockRole(id: string, actorLevel: number): DeleteRoleOutcome {
  const index = mockRoles.findIndex((item) => item.id === id);

  if (index === -1) {
    return { ok: false, status: 404, code: 10002, message: 'Role not found' };
  }

  const role = mockRoles[index];
  if (!role) {
    return { ok: false, status: 404, code: 10002, message: 'Role not found' };
  }

  if (!canManageRole(actorLevel, role.code, role.level)) {
    return {
      ok: false,
      status: 403,
      code: 10007,
      message: 'Protected roles cannot be deleted',
    };
  }

  if (isRoleBoundToUser(role)) {
    return {
      ok: false,
      status: 409,
      code: 10006,
      message: 'Role is still assigned to users',
    };
  }

  mockRoles.splice(index, 1);
  return { ok: true };
}

export default defineMock([
  // Get role list
  {
    url: '/api/roles',
    method: 'GET',
    response: (req, res) => {
      const authorization = authorizeRoute('GET /api/roles', req.headers.authorization);
      if (!authorization.ok) {
        fail(res, authorization.status, authorization.code, authorization.message);
        return;
      }
      const current = Number(req.query.current ?? 1);
      const pageSize = Number(req.query.pageSize ?? 10);
      const name = normalizeQueryValue(req.query.name);
      const code = normalizeQueryValue(req.query.code);

      let filteredRoles = [...mockRoles];

      if (name) {
        filteredRoles = filteredRoles.filter((role) =>
          role.name.toLowerCase().includes(name.toLowerCase()),
        );
      }

      if (code) {
        filteredRoles = filteredRoles.filter((role) =>
          role.code.toLowerCase().includes(code.toLowerCase()),
        );
      }

      const start = (current - 1) * pageSize;
      const end = start + pageSize;

      success(res, {
        list: filteredRoles.slice(start, end),
        total: filteredRoles.length,
        current,
        pageSize,
      });
    },
  },

  // Get role by ID
  {
    url: '/api/roles/:id',
    method: 'GET',
    response: (req, res) => {
      const authorization = authorizeRoute('GET /api/roles/:id', req.headers.authorization);
      if (!authorization.ok) {
        fail(res, authorization.status, authorization.code, authorization.message);
        return;
      }
      const role = mockRoles.find((item) => item.id === req.params.id);

      if (!role) {
        fail(res, 404, 10002, 'Role not found');
        return;
      }

      success(res, role);
    },
  },

  // Create role
  {
    url: '/api/roles',
    method: 'POST',
    response: (req, res) => {
      const authorization = authorizeRoute('POST /api/roles', req.headers.authorization);
      if (!authorization.ok) {
        fail(res, authorization.status, authorization.code, authorization.message);
        return;
      }
      const payload = req.body || {};
      const code = normalizeQueryValue(payload.code);
      const name = normalizeQueryValue(payload.name);

      if (!code || !name || !/^[a-zA-Z0-9_.-]+$/.test(code)) {
        fail(res, 400, 10001, 'Invalid role payload');
        return;
      }

      if (code === 'super_admin') {
        fail(res, 403, 10007, 'The super administrator role is protected');
        return;
      }

      if (mockRoles.some((role) => role.code === code)) {
        fail(res, 409, 10006, 'Role code already exists');
        return;
      }

      const permissionFailure = validateRolePermissions(payload.permissions);
      if (permissionFailure) {
        fail(res, permissionFailure.status, permissionFailure.code, permissionFailure.message);
        return;
      }

      const level = Number(payload.level ?? 0);
      const actorLevel = actorLevelFromToken(req.headers.authorization);
      const levelFailure = validateRoleLevel(code, level, actorLevel, true);
      if (levelFailure) {
        fail(res, levelFailure.status, levelFailure.code, levelFailure.message);
        return;
      }

      const newRole: Role = {
        id: faker.string.uuid(),
        name,
        code,
        description: typeof payload.description === 'string' ? payload.description : '',
        level,
        permissions: normalizeRolePermissions(payload.permissions),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockRoles.push(newRole);

      success(res, newRole, 'Role created successfully');
    },
  },

  // Update role
  {
    url: '/api/roles/:id',
    method: 'PUT',
    response: (req, res) => {
      const authorization = authorizeRoute('PUT /api/roles/:id', req.headers.authorization);
      if (!authorization.ok) {
        fail(res, authorization.status, authorization.code, authorization.message);
        return;
      }
      const payload = req.body || {};
      const role = mockRoles.find((item) => item.id === req.params.id);

      if (!role) {
        fail(res, 404, 10002, 'Role not found');
        return;
      }

      const actorLevel = actorLevelFromToken(req.headers.authorization);
      if (!canManageRole(actorLevel, role.code, role.level)) {
        fail(res, 403, 10007, 'The role is protected at this priority');
        return;
      }

      if (payload.code !== undefined && payload.code !== role.code) {
        fail(res, 400, 10001, 'Role code cannot be changed');
        return;
      }

      const name = normalizeQueryValue(payload.name);
      if (payload.name !== undefined && !name) {
        fail(res, 400, 10001, 'Invalid role payload');
        return;
      }

      if (payload.permissions !== undefined) {
        const permissionFailure = validateRolePermissions(payload.permissions);
        if (permissionFailure) {
          fail(res, permissionFailure.status, permissionFailure.code, permissionFailure.message);
          return;
        }
      }

      if (name) {
        role.name = name;
      }
      if (payload.description !== undefined) {
        role.description = typeof payload.description === 'string' ? payload.description : '';
      }
      if (payload.level !== undefined) {
        const levelFailure = validateRoleLevel(role.code, payload.level, actorLevel, false);
        if (levelFailure) {
          fail(res, levelFailure.status, levelFailure.code, levelFailure.message);
          return;
        }
        role.level = Number(payload.level);
      }
      if (payload.permissions !== undefined) {
        role.permissions = normalizeRolePermissions(payload.permissions);
      }
      role.updatedAt = new Date().toISOString();

      success(res, role, 'Role updated successfully');
    },
  },

  // Delete role
  {
    url: '/api/roles/:id',
    method: 'DELETE',
    response: (req, res) => {
      const authorization = authorizeRoute('DELETE /api/roles/:id', req.headers.authorization);
      if (!authorization.ok) {
        fail(res, authorization.status, authorization.code, authorization.message);
        return;
      }
      const actorLevel = actorLevelFromToken(req.headers.authorization);
      const outcome = deleteMockRole(req.params.id, actorLevel);

      if (!outcome.ok) {
        fail(res, outcome.status, outcome.code, outcome.message);
        return;
      }

      success(res, null, 'Role deleted successfully');
    },
  },
]);
