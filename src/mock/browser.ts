import type { Permission, Role, User } from '@/types/auth';
import type { SysConfig } from '@/types/config';
import type { DictData } from '@/types/dict';
import type { SysFile } from '@/types/file';
import type { LoginLog, OperationLog } from '@/types/log';
import type { AxiosInstance } from 'axios';

import AxiosMockAdapter from 'axios-mock-adapter';

import avatarImg from '@/assets/images/avatar-256.png';

import { sysConfigs } from '../../mock/data/config.data';
import {
  mockActivities,
  mockChartData,
  mockSalesTrend,
  mockStats,
  mockUserDistribution,
} from '../../mock/data/dashboard.data';
import { dictTypes, dictData } from '../../mock/data/dict.data';
import { sysFiles } from '../../mock/data/file.data';
import { operationLogs, loginLogs } from '../../mock/data/log.data';
import { mockPermissions } from '../../mock/data/permissions.data';
import { mockRoles } from '../../mock/data/roles.data';

const SUCCESS_MESSAGE = 'success';
const DEMO_CREATED_AT = '2023-01-01T00:00:00.000Z';
const DEMO_UPDATED_AT = '2023-01-01T00:00:00.000Z';

const adminUser: User = {
  id: '1',
  username: 'admin',
  email: 'admin@example.com',
  displayName: 'Administrator',
  avatar: avatarImg,
  phone: '13800138000',
  gender: 'male',
  birthDate: '1990-01-01',
  bio: 'System Administrator',
  status: 'active',
  createdAt: DEMO_CREATED_AT,
  updatedAt: DEMO_UPDATED_AT,
  roles: [
    {
      id: '1',
      name: 'Administrator',
      code: 'admin',
      description: 'System Administrator',
      level: 90,
      permissions: [],
      createdAt: DEMO_CREATED_AT,
      updatedAt: DEMO_UPDATED_AT,
    },
  ],
  permissions: [
    {
      id: '1',
      name: 'All Permissions',
      code: '*',
      description: 'Has all permissions',
      resource: '*',
      action: '*',
      type: 'api',
    },
  ],
};

const regularUser: User = {
  id: '2',
  username: 'user',
  email: 'user@example.com',
  displayName: 'Regular User',
  avatar: avatarImg,
  phone: '13800138001',
  gender: 'female',
  birthDate: '1995-05-15',
  bio: 'Regular User',
  status: 'active',
  createdAt: DEMO_CREATED_AT,
  updatedAt: DEMO_UPDATED_AT,
  roles: [
    {
      id: '2',
      name: 'User',
      code: 'user',
      description: 'Regular User',
      level: 50,
      permissions: [],
      createdAt: DEMO_CREATED_AT,
      updatedAt: DEMO_UPDATED_AT,
    },
  ],
  permissions: [
    {
      id: '2',
      name: 'View Dashboard',
      code: 'dashboard.view',
      description: 'Can view dashboard',
      resource: 'dashboard',
      action: 'view',
      type: 'menu',
    },
  ],
};

const demoUsers: User[] = [
  adminUser,
  regularUser,
  {
    id: '3',
    username: 'manager',
    email: 'manager@example.com',
    displayName: 'Demo Manager',
    avatar: avatarImg,
    phone: '13800138002',
    gender: 'male',
    birthDate: '1992-08-12',
    bio: 'Demo Manager',
    status: 'active',
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_UPDATED_AT,
    roles: [mockRoles[1]],
    permissions: [],
  },
  {
    id: '4',
    username: 'guest',
    email: 'guest@example.com',
    displayName: 'Demo Guest',
    avatar: avatarImg,
    phone: '13800138003',
    gender: 'female',
    birthDate: '1998-03-20',
    bio: 'Demo Guest',
    status: 'inactive',
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_UPDATED_AT,
    roles: [mockRoles[3]],
    permissions: [],
  },
];

function successResponse<T>(data: T) {
  return {
    code: 0,
    message: SUCCESS_MESSAGE,
    success: true,
    data,
  };
}

function resolveRolePermissions(roleCodes: string[]) {
  const selected = new Set(roleCodes);
  const seen = new Set<string>();
  const permissions: Permission[] = [];

  for (const role of mockRoles) {
    if (!selected.has(role.code)) continue;
    for (const permission of role.permissions) {
      if (permission.code === '*' || seen.has(permission.code)) continue;
      seen.add(permission.code);
      permissions.push(permission);
    }
  }

  return permissions.sort((left, right) => left.code.localeCompare(right.code));
}
function createMockToken(userId: string): string {
  return `mock-token-${userId}-${Date.now()}`;
}

function createMockRefreshToken(userId: string): string {
  return `mock-refresh-token-${userId}-${Date.now()}`;
}

function resolveMockUserIdFromToken(token?: string): string | null {
  if (!token) return null;
  const parts = token.split('-');
  const tokenIndex = parts.indexOf('token');
  const refreshIndex = parts.indexOf('refresh');
  const userIdIndex = tokenIndex !== -1 ? tokenIndex + 1 : refreshIndex + 2;
  const userId = parts[userIdIndex];
  return userId === '1' || userId === '2' ? userId : null;
}

function getAuthorizationToken(headers: unknown): string | undefined {
  if (!headers || typeof headers !== 'object') return undefined;

  const record = headers as Record<string, string | undefined>;
  const value = record.Authorization || record.authorization;
  return value?.replace('Bearer ', '');
}

/**
 * Demo 浏览器 mock 的 RBAC 拒绝：与 dev mock / 真实后端 route_permissions 同源。
 * demo 默认以 admin（* 通配）身份运行，仅有 token 对应非管理员角色时才触发拒绝。
 */
const BROWSER_ROUTE_PERMISSIONS: Record<string, string> = {
  'GET /api/roles': 'system.role.view',
  'POST /api/roles': 'system.role.create',
  'PUT /api/roles/:id': 'system.role.edit',
  'DELETE /api/roles/:id': 'system.role.delete',
  'GET /api/permissions': 'system.permission.view',
  'GET /api/permissions/tree': 'system.role.view',
  'POST /api/permissions': 'system.permission.create',
  'PUT /api/permissions/:id': 'system.permission.edit',
  'DELETE /api/permissions/:id': 'system.permission.delete',
};

function permissionDenied(routeKey: string, headers: unknown): Record<string, unknown> | null {
  const requiredCode = BROWSER_ROUTE_PERMISSIONS[routeKey];
  if (!requiredCode) return null;

  const userId = resolveMockUserIdFromToken(getAuthorizationToken(headers));
  const user = demoUsers.find((item) => item.id === userId);
  // demo 在未携带有效 token 时按 admin 数据集运行，保持静态演示可用。
  if (!user || user.username === 'admin') return null;

  const roleCodes = user.roles.map((role) => role.code);
  const wildcard = mockRoles
    .filter((role) => roleCodes.includes(role.code))
    .some((role) => role.permissions.some((permission) => permission.code === '*'));
  if (wildcard) return null;

  const codes = new Set(
    mockRoles
      .filter((role) => roleCodes.includes(role.code))
      .flatMap((role) => role.permissions.map((permission) => permission.code)),
  );
  if (codes.has(requiredCode)) return null;

  return { code: 20002, message: '没有访问权限', success: false, data: null };
}

/** 按 token 推导 demo 操作者层级：admin 等同超级管理员（101），其余取持有角色的最高层级。 */
function canManageRoleByToken(headers: unknown, code: string, level: number): boolean {
  if (code === 'super_admin') return false;

  const userId = resolveMockUserIdFromToken(getAuthorizationToken(headers));
  const user = demoUsers.find((item) => item.id === userId);
  // 未携带有效 token 时 demo 仍以管理员数据集运行，保持静态演示可用。
  if (!user || user.username === 'admin') return true;

  const roleCodes = user.roles.map((role) => role.code);
  if (roleCodes.includes('super_admin')) return true;

  const actorLevel = mockRoles
    .filter((role) => roleCodes.includes(role.code))
    .reduce((highest, role) => Math.max(highest, role.level ?? 0), 0);

  return level < actorLevel;
}

function parseJsonBody<T>(data: unknown, fallback: T): T {
  if (typeof data !== 'string') return fallback;

  try {
    return JSON.parse(data) as T;
  } catch {
    return fallback;
  }
}

function cloneData<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T;
}

function getQueryParam(configUrl: string | undefined, key: string): string {
  const url = new URL(configUrl || '', 'https://mock.local');
  return url.searchParams.get(key) || '';
}

function getConfigList(url: string | undefined) {
  const name = getQueryParam(url, 'name');
  const key = getQueryParam(url, 'key');
  const group = getQueryParam(url, 'group');
  const page = Number(getQueryParam(url, 'page') || 1);
  const pageSize = Number(getQueryParam(url, 'pageSize') || 20);

  let filtered = cloneData<SysConfig[]>(sysConfigs);

  if (name) {
    filtered = filtered.filter((item) => item.name.includes(name));
  }
  if (key) {
    filtered = filtered.filter((item) => item.key.includes(key));
  }
  if (group) {
    filtered = filtered.filter((item) => item.group === group);
  }

  filtered.sort((a, b) => a.sort - b.sort);
  const start = (page - 1) * pageSize;

  return {
    list: filtered.slice(start, start + pageSize),
    total: filtered.length,
    current: page,
    pageSize,
  };
}

function getDictTypeList(url: string | undefined) {
  const name = getQueryParam(url, 'name');
  const code = getQueryParam(url, 'code');
  const status = getQueryParam(url, 'status');
  const page = Number(getQueryParam(url, 'page') || 1);
  const pageSize = Number(getQueryParam(url, 'pageSize') || 10);

  let filtered = cloneData(dictTypes);

  if (name) filtered = filtered.filter((item) => item.name.includes(name));
  if (code) filtered = filtered.filter((item) => item.code.includes(code));
  if (status) filtered = filtered.filter((item) => item.status === status);

  const start = (page - 1) * pageSize;

  return {
    list: filtered.slice(start, start + pageSize),
    total: filtered.length,
    current: page,
    pageSize,
  };
}

function getDictDataList(url: string | undefined) {
  const typeCode = getQueryParam(url, 'typeCode');
  const label = getQueryParam(url, 'label');
  const value = getQueryParam(url, 'value');
  const status = getQueryParam(url, 'status');
  const page = Number(getQueryParam(url, 'page') || 1);
  const pageSize = Number(getQueryParam(url, 'pageSize') || 10);

  let filtered = cloneData<DictData[]>(dictData);

  if (typeCode) filtered = filtered.filter((item) => item.typeCode === typeCode);
  if (label) filtered = filtered.filter((item) => item.label.includes(label));
  if (value) filtered = filtered.filter((item) => item.value.includes(value));
  if (status) filtered = filtered.filter((item) => item.status === status);

  const start = (page - 1) * pageSize;

  return {
    list: filtered.slice(start, start + pageSize),
    total: filtered.length,
    current: page,
    pageSize,
  };
}

function getFileList(url: string | undefined) {
  const name = getQueryParam(url, 'name');
  const ext = getQueryParam(url, 'ext');
  const storage = getQueryParam(url, 'storage');
  const page = Number(getQueryParam(url, 'page') || 1);
  const pageSize = Number(getQueryParam(url, 'pageSize') || 20);

  let filtered = cloneData<SysFile[]>(sysFiles);

  if (name) filtered = filtered.filter((item) => item.originalName.includes(name));
  if (ext) filtered = filtered.filter((item) => item.ext === ext);
  if (storage) filtered = filtered.filter((item) => item.storage === storage);

  const start = (page - 1) * pageSize;

  return {
    list: filtered.slice(start, start + pageSize),
    total: filtered.length,
    current: page,
    pageSize,
  };
}

function getOperationLogList(url: string | undefined) {
  const username = getQueryParam(url, 'username');
  const module = getQueryParam(url, 'module');
  const action = getQueryParam(url, 'action');
  const status = getQueryParam(url, 'status');
  const startTime = getQueryParam(url, 'startTime');
  const endTime = getQueryParam(url, 'endTime');
  const page = Number(getQueryParam(url, 'page') || 1);
  const pageSize = Number(getQueryParam(url, 'pageSize') || 10);

  let filtered = cloneData<OperationLog[]>(operationLogs);

  if (username) filtered = filtered.filter((item) => item.username.includes(username));
  if (module) filtered = filtered.filter((item) => item.module === module);
  if (action) filtered = filtered.filter((item) => item.action === action);
  if (status) filtered = filtered.filter((item) => item.status === status);
  if (startTime) filtered = filtered.filter((item) => item.createTime >= startTime);
  if (endTime) filtered = filtered.filter((item) => item.createTime <= endTime);

  const start = (page - 1) * pageSize;

  return {
    list: filtered.slice(start, start + pageSize),
    total: filtered.length,
    current: page,
    pageSize,
  };
}

function getLoginLogList(url: string | undefined) {
  const username = getQueryParam(url, 'username');
  const ip = getQueryParam(url, 'ip');
  const status = getQueryParam(url, 'status');
  const startTime = getQueryParam(url, 'startTime');
  const endTime = getQueryParam(url, 'endTime');
  const page = Number(getQueryParam(url, 'page') || 1);
  const pageSize = Number(getQueryParam(url, 'pageSize') || 10);

  let filtered = cloneData<LoginLog[]>(loginLogs);

  if (username) filtered = filtered.filter((item) => item.username.includes(username));
  if (ip) filtered = filtered.filter((item) => item.ip.includes(ip));
  if (status) filtered = filtered.filter((item) => item.status === status);
  if (startTime) filtered = filtered.filter((item) => item.createTime >= startTime);
  if (endTime) filtered = filtered.filter((item) => item.createTime <= endTime);

  const start = (page - 1) * pageSize;

  return {
    list: filtered.slice(start, start + pageSize),
    total: filtered.length,
    current: page,
    pageSize,
  };
}

function findPermissionById(list: Permission[], id: string): Permission | null {
  for (const permission of list) {
    if (permission.id === id) return permission;
    const child = permission.children ? findPermissionById(permission.children, id) : null;
    if (child) return child;
  }

  return null;
}

function getPaginatedUsers(url: string | undefined) {
  const username = getQueryParam(url, 'username').toLowerCase();
  const email = getQueryParam(url, 'email').toLowerCase();
  const status = getQueryParam(url, 'status');
  const gender = getQueryParam(url, 'gender');
  const current = Number(getQueryParam(url, 'current') || 1);
  const pageSize = Number(getQueryParam(url, 'pageSize') || 10);

  let filtered = cloneData<User[]>(demoUsers);

  if (username) {
    filtered = filtered.filter((item) => item.username.toLowerCase().includes(username));
  }
  if (email) {
    filtered = filtered.filter((item) => item.email.toLowerCase().includes(email));
  }
  if (status) {
    filtered = filtered.filter((item) => item.status === status);
  }
  if (gender) {
    const genderValues = gender
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    filtered = filtered.filter((item) => genderValues.includes(String(item.gender)));
  }

  const start = (current - 1) * pageSize;

  return {
    list: filtered.slice(start, start + pageSize),
    total: filtered.length,
    current,
    pageSize,
  };
}

function getPaginatedRoles(url: string | undefined) {
  const name = getQueryParam(url, 'name').toLowerCase();
  const code = getQueryParam(url, 'code').toLowerCase();
  const current = Number(getQueryParam(url, 'current') || 1);
  const pageSize = Number(getQueryParam(url, 'pageSize') || 10);

  let filtered = cloneData<Role[]>(mockRoles);

  if (name) {
    filtered = filtered.filter((item) => item.name.toLowerCase().includes(name));
  }
  if (code) {
    filtered = filtered.filter((item) => item.code.toLowerCase().includes(code));
  }

  const start = (current - 1) * pageSize;

  return {
    list: filtered.slice(start, start + pageSize),
    total: filtered.length,
    current,
    pageSize,
  };
}

function getPageParams(url: string | undefined) {
  return {
    current: Number(getQueryParam(url, 'current') || getQueryParam(url, 'page') || 1),
    pageSize: Number(getQueryParam(url, 'pageSize') || 10),
  };
}

function fallbackDemoResponse(config: { data?: unknown; method?: string; url?: string }) {
  const method = config.method?.toLowerCase() || 'get';
  const url = config.url || '';

  if (method === 'get' && /\/list(?:\?.*)?$|[?&](current|page|pageSize)=/.test(url)) {
    const { current, pageSize } = getPageParams(url);
    return successResponse({ list: [], total: 0, current, pageSize });
  }

  if (method === 'post' || method === 'put' || method === 'patch') {
    return successResponse(parseJsonBody(config.data, null));
  }

  return successResponse(null);
}

export function setupBrowserMock(service: AxiosInstance): AxiosMockAdapter {
  const mock = new AxiosMockAdapter(service, { delayResponse: 250 });
  let refreshTokenValue: string | null = null;
  let rememberSession = false;
  let refreshExpiresAt = 0;

  mock.onGet(/\/api\/__mock_health$|\/__mock_health$/).reply(200, {
    code: 0,
    message: SUCCESS_MESSAGE,
    success: true,
    data: { enabled: true },
  });

  mock.onPost(/\/api\/auth\/login$|\/auth\/login$/).reply((config) => {
    const body = parseJsonBody<{
      password?: string;
      username?: string;
      remember?: boolean;
      rememberDays?: number;
    }>(config.data, {});
    const user =
      body.username === 'admin' && body.password === '123456'
        ? adminUser
        : body.username === 'user' && body.password === '123456'
          ? regularUser
          : null;

    if (!user) {
      return [
        200,
        {
          code: 401,
          message: 'Invalid username or password',
          success: false,
          data: null,
        },
      ];
    }

    if (body.remember && ![7, 15, 30].includes(body.rememberDays ?? 0)) {
      return [400, { code: 10001, message: 'Invalid remember duration', data: null }];
    }
    refreshTokenValue = createMockRefreshToken(user.id);
    rememberSession = body.remember === true;
    refreshExpiresAt = Date.now() + (rememberSession ? body.rememberDays! : 1) * 86400_000;

    return [
      200,
      successResponse({
        token: createMockToken(user.id),
        expiresIn: 900,
        sessionId: refreshTokenValue,
        remember: rememberSession,
      }),
    ];
  });

  mock.onGet(/\/api\/auth\/info$|\/auth\/info$/).reply((config) => {
    const token = getAuthorizationToken(config.headers);
    const userId = resolveMockUserIdFromToken(token);
    if (!userId) {
      return [200, { code: 401, message: 'Unauthorized', success: false, data: null }];
    }

    return [200, successResponse(userId === '1' ? adminUser : regularUser)];
  });

  mock.onPost(/\/api\/auth\/refresh$|\/auth\/refresh$/).reply(() => {
    const userId =
      Date.now() < refreshExpiresAt
        ? resolveMockUserIdFromToken(refreshTokenValue || undefined)
        : null;
    if (!userId) {
      return [
        200,
        {
          code: 401,
          message: 'Invalid refresh token',
          success: false,
          data: null,
        },
      ];
    }

    return [
      200,
      successResponse({
        token: createMockToken(userId),
        expiresIn: 900,
        sessionId: refreshTokenValue,
        remember: rememberSession,
      }),
    ];
  });

  mock.onPost(/\/api\/auth\/logout$|\/auth\/logout$/).reply(() => {
    refreshTokenValue = null;
    return [200, successResponse(null)];
  });

  mock
    .onGet(/\/api\/dict\/types$|\/dict\/types$/)
    .reply(200, successResponse(cloneData(dictTypes)));
  mock
    .onGet(/\/api\/dict\/type\/list(?:\?.*)?$|\/dict\/type\/list(?:\?.*)?$/)
    .reply((config) => [200, successResponse(getDictTypeList(config.url))]);
  mock.onPost(/\/api\/dict\/type$|\/dict\/type$/).reply((config) => {
    const body = parseJsonBody(config.data, {});
    return [200, successResponse({ id: String(Date.now()), ...body })];
  });
  mock.onPut(/\/api\/dict\/type\/[^/]+$|\/dict\/type\/[^/]+$/).reply((config) => {
    const body = parseJsonBody(config.data, {});
    const id = config.url?.split('/dict/type/')[1]?.split('?')[0] || '';
    return [200, successResponse({ id, ...body })];
  });
  mock.onDelete(/\/api\/dict\/type\/[^/]+$|\/dict\/type\/[^/]+$/).reply(200, successResponse(null));

  mock
    .onGet(/\/api\/dict\/data\/all$|\/dict\/data\/all$/)
    .reply(200, successResponse(cloneData<DictData[]>(dictData)));
  mock
    .onGet(/\/api\/dict\/data\/list(?:\?.*)?$|\/dict\/data\/list(?:\?.*)?$/)
    .reply((config) => [200, successResponse(getDictDataList(config.url))]);
  mock.onGet(/\/api\/dict\/data\/[^/]+$|\/dict\/data\/[^/]+$/).reply((config) => {
    const typeCode = config.url?.split('/dict/data/')[1]?.split('?')[0] || '';
    const list = dictData.filter((item) => item.typeCode === typeCode && item.status === 'enabled');
    return [200, successResponse(cloneData(list))];
  });
  mock.onPost(/\/api\/dict\/data$|\/dict\/data$/).reply((config) => {
    const body = parseJsonBody(config.data, {});
    return [200, successResponse({ id: String(Date.now()), ...body })];
  });
  mock.onPut(/\/api\/dict\/data\/[^/]+$|\/dict\/data\/[^/]+$/).reply((config) => {
    const body = parseJsonBody(config.data, {});
    const id = config.url?.split('/dict/data/')[1]?.split('?')[0] || '';
    return [200, successResponse({ id, ...body })];
  });
  mock.onDelete(/\/api\/dict\/data\/[^/]+$|\/dict\/data\/[^/]+$/).reply(200, successResponse(null));

  mock.onGet(/\/api\/dashboard\/stats$|\/dashboard\/stats$/).reply(200, successResponse(mockStats));
  mock
    .onGet(/\/api\/dashboard\/sales-trend$|\/dashboard\/sales-trend$/)
    .reply(200, successResponse(mockSalesTrend));
  mock
    .onGet(/\/api\/dashboard\/user-distribution$|\/dashboard\/user-distribution$/)
    .reply(200, successResponse(mockUserDistribution));
  mock
    .onGet(/\/api\/dashboard\/activities$|\/dashboard\/activities$/)
    .reply(200, successResponse(mockActivities));
  mock
    .onGet(/\/api\/dashboard\/chart-data$|\/dashboard\/chart-data$/)
    .reply(200, successResponse(mockChartData));

  mock
    .onGet(/\/api\/permissions$|\/permissions$/)
    .reply((config) => {
      const denied = permissionDenied('GET /api/permissions', config.headers);
      if (denied) return [403, denied];
      return [200, successResponse(cloneData<Permission[]>(mockPermissions))];
    });
  mock
    .onGet(/\/api\/permissions\/tree$|\/permissions\/tree$/)
    .reply((config) => {
      const denied = permissionDenied('GET /api/permissions/tree', config.headers);
      if (denied) return [403, denied];
      return [200, successResponse(cloneData<Permission[]>(mockPermissions))];
    });
  mock.onGet(/\/api\/permissions\/user$|\/permissions\/user$/).reply((config) => {
    const token = getAuthorizationToken(config.headers);
    const userId = resolveMockUserIdFromToken(token);
    // Without a token the demo keeps serving the admin dataset so static demo pages stay usable.
    const user = demoUsers.find((item) => item.id === userId) ?? adminUser;

    const wildcard =
      user.username === 'admin' ||
      user.roles.some((role) =>
        mockRoles
          .filter((candidate) => candidate.code === role.code)
          .some((candidate) => candidate.permissions.some((permission) => permission.code === '*')),
      );
    const permissions = wildcard
      ? (mockRoles.find((role) => role.code === 'super_admin')?.permissions ?? [])
      : resolveRolePermissions(user.roles.map((role) => role.code));

    return [200, successResponse(cloneData<Permission[]>(permissions))];
  });
  mock.onGet(/\/api\/permissions\/[^/]+$|\/permissions\/[^/]+$/).reply((config) => {
    const denied = permissionDenied('GET /api/permissions/:id', config.headers);
    if (denied) return [403, denied];
    const id = config.url?.split('/permissions/')[1]?.split('?')[0] || '';
    const item = findPermissionById(mockPermissions, id);

    if (!item) {
      return [200, { code: 404, message: 'Permission not found', success: false, data: null }];
    }

    return [200, successResponse(cloneData(item))];
  });
  mock.onPost(/\/api\/permissions$|\/permissions$/).reply((config) => {
    const denied = permissionDenied('POST /api/permissions', config.headers);
    if (denied) return [403, denied];
    const body = parseJsonBody(config.data, {});
    return [200, successResponse({ id: String(Date.now()), ...body })];
  });
  mock.onPut(/\/api\/permissions\/[^/]+$|\/permissions\/[^/]+$/).reply((config) => {
    const denied = permissionDenied('PUT /api/permissions/:id', config.headers);
    if (denied) return [403, denied];
    const body = parseJsonBody(config.data, {});
    const id = config.url?.split('/permissions/')[1]?.split('?')[0] || '';
    return [200, successResponse({ id, ...body })];
  });
  mock.onDelete(/\/api\/permissions\/[^/]+$|\/permissions\/[^/]+$/).reply((config) => {
    const denied = permissionDenied('DELETE /api/permissions/:id', config.headers);
    if (denied) return [403, denied];
    const id = config.url?.split('/permissions/')[1]?.split('?')[0] || '';
    const item = findPermissionById(mockPermissions, id);

    if (!item) {
      return [404, { code: 10002, message: 'Permission not found', success: false, data: null }];
    }

    if (item.children && item.children.length > 0) {
      return [
        409,
        {
          code: 10006,
          message: 'Permission still has child permissions',
          success: false,
          data: null,
        },
      ];
    }

    const referenced = mockRoles.some((role) =>
      role.permissions.some((permission) => permission.code === item.code),
    );
    if (referenced) {
      return [
        409,
        {
          code: 10006,
          message: 'Permission is still referenced by roles',
          success: false,
          data: null,
        },
      ];
    }

    return [200, successResponse(null)];
  });

  mock
    .onGet(/\/api\/file\/list(?:\?.*)?$|\/file\/list(?:\?.*)?$/)
    .reply((config) => [200, successResponse(getFileList(config.url))]);
  mock.onDelete(/\/api\/file\/[^/]+$|\/file\/[^/]+$/).reply(200, successResponse(null));

  mock
    .onGet(/\/api\/log\/operation\/list(?:\?.*)?$|\/log\/operation\/list(?:\?.*)?$/)
    .reply((config) => [200, successResponse(getOperationLogList(config.url))]);
  mock
    .onGet(/\/api\/log\/login\/list(?:\?.*)?$|\/log\/login\/list(?:\?.*)?$/)
    .reply((config) => [200, successResponse(getLoginLogList(config.url))]);
  mock
    .onDelete(/\/api\/log\/operation\/clear$|\/log\/operation\/clear$/)
    .reply(200, successResponse(null));
  mock.onDelete(/\/api\/log\/login\/clear$|\/log\/login\/clear$/).reply(200, successResponse(null));

  mock
    .onGet(/\/api\/users(?:\?.*)?$|\/users(?:\?.*)?$/)
    .reply((config) => [200, successResponse(getPaginatedUsers(config.url))]);

  mock.onGet(/\/api\/users\/[^/]+$|\/users\/[^/]+$/).reply((config) => {
    const id = config.url?.split('/users/')[1]?.split('?')[0] || '';
    const item = demoUsers.find((user) => user.id === id);

    if (!item) {
      return [200, { code: 404, message: 'User not found', success: false, data: null }];
    }

    return [200, successResponse(cloneData(item))];
  });

  mock.onPost(/\/api\/users$|\/users$/).reply((config) => {
    const body = parseJsonBody<Partial<User>>(config.data, {});
    return [
      200,
      successResponse({
        ...regularUser,
        ...body,
        id: String(Date.now()),
        username: body.username || `user_${Date.now()}`,
        email: body.email || 'user@example.com',
        displayName: body.displayName || 'Demo User',
        avatar: body.avatar || avatarImg,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    ];
  });

  mock.onPut(/\/api\/users\/[^/]+$|\/users\/[^/]+$/).reply((config) => {
    const body = parseJsonBody<Partial<User>>(config.data, {});
    const id = config.url?.split('/users/')[1]?.split('?')[0] || '';
    const item = demoUsers.find((user) => user.id === id) || regularUser;
    return [200, successResponse({ ...item, ...body, updatedAt: new Date().toISOString() })];
  });

  mock.onDelete(/\/api\/users\/[^/]+$|\/users\/[^/]+$/).reply(200, successResponse(null));
  mock
    .onPost(/\/api\/users\/change-password$|\/users\/change-password$/)
    .reply(200, successResponse(null));

  mock
    .onGet(/\/api\/roles(?:\?.*)?$|\/roles(?:\?.*)?$/)
    .reply((config) => {
      const denied = permissionDenied('GET /api/roles', config.headers);
      if (denied) return [403, denied];
      return [200, successResponse(getPaginatedRoles(config.url))];
    });

  mock.onGet(/\/api\/roles\/[^/]+$|\/roles\/[^/]+$/).reply((config) => {
    const denied = permissionDenied('GET /api/roles/:id', config.headers);
    if (denied) return [403, denied];
    const id = config.url?.split('/roles/')[1]?.split('?')[0] || '';
    const item = mockRoles.find((role) => role.id === id);

    if (!item) {
      return [200, { code: 404, message: 'Role not found', success: false, data: null }];
    }

    return [200, successResponse(cloneData(item))];
  });

  mock.onPost(/\/api\/roles$|\/roles$/).reply((config) => {
    const denied = permissionDenied('POST /api/roles', config.headers);
    if (denied) return [403, denied];
    const body = parseJsonBody<Partial<Role>>(config.data, {});
    return [
      200,
      successResponse({
        id: String(Date.now()),
        name: body.name || 'Custom Role',
        code: body.code || `role_${Date.now()}`,
        description: body.description || '',
        permissions: body.permissions || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    ];
  });

  mock.onPut(/\/api\/roles\/[^/]+$|\/roles\/[^/]+$/).reply((config) => {
    const denied = permissionDenied('PUT /api/roles/:id', config.headers);
    if (denied) return [403, denied];
    const body = parseJsonBody<Partial<Role>>(config.data, {});
    const id = config.url?.split('/roles/')[1]?.split('?')[0] || '';
    const item = mockRoles.find((role) => role.id === id) || mockRoles[0];
    return [200, successResponse({ ...item, ...body, updatedAt: new Date().toISOString() })];
  });

  mock.onDelete(/\/api\/roles\/[^/]+$|\/roles\/[^/]+$/).reply((config) => {
    const denied = permissionDenied('DELETE /api/roles/:id', config.headers);
    if (denied) return [403, denied];
    const id = config.url?.split('/roles/')[1]?.split('?')[0] || '';
    const index = mockRoles.findIndex((role) => role.id === id);
    const role = mockRoles[index];

    if (!role) {
      return [404, { code: 10002, message: 'Role not found', success: false, data: null }];
    }

    if (!canManageRoleByToken(config.headers, role.code, role.level ?? 0)) {
      return [
        403,
        { code: 10007, message: 'Protected roles cannot be deleted', success: false, data: null },
      ];
    }

    const bound = demoUsers.some((user) =>
      user.roles.some((userRole) => userRole.id === role.id || userRole.code === role.code),
    );
    if (bound) {
      return [
        409,
        { code: 10006, message: 'Role is still assigned to users', success: false, data: null },
      ];
    }

    mockRoles.splice(index, 1);
    return [200, successResponse(null)];
  });

  mock
    .onGet(/\/api\/config\/list(?:\?.*)?$|\/config\/list(?:\?.*)?$/)
    .reply((config) => [200, successResponse(getConfigList(config.url))]);

  mock.onGet(/\/api\/config\/key\/[^/]+$|\/config\/key\/[^/]+$/).reply((config) => {
    const key = config.url?.split('/config/key/')[1]?.split('?')[0] || '';
    const item = sysConfigs.find((configItem) => configItem.key === key);

    if (!item) {
      return [200, { code: 404, message: 'Config not found', success: false }];
    }

    return [200, successResponse(cloneData(item))];
  });

  mock.onPost(/\/api\/config$|\/config$/).reply((config) => {
    const body = parseJsonBody<Partial<SysConfig>>(config.data, {});
    const newConfig: SysConfig = {
      id: String(Date.now()),
      name: body.name || 'Custom Config',
      key: body.key || `custom.${Date.now()}`,
      value: body.value || '',
      valueType: body.valueType || 'string',
      group: body.group || 'basic',
      description: body.description || '',
      builtIn: false,
      sort: body.sort || 100,
      createTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      updateTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };

    return [200, successResponse(newConfig)];
  });

  mock.onPut(/\/api\/config\/[^/]+$|\/config\/[^/]+$/).reply((config) => {
    const body = parseJsonBody<Partial<SysConfig>>(config.data, {});
    const id = config.url?.split('/config/')[1]?.split('?')[0] || '';
    const item = sysConfigs.find((configItem) => configItem.id === id);

    if (!item) {
      return [200, { code: 404, message: 'Config not found', success: false }];
    }

    return [
      200,
      successResponse({
        ...item,
        ...body,
        updateTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      }),
    ];
  });

  mock.onDelete(/\/api\/config\/[^/]+$|\/config\/[^/]+$/).reply(200, successResponse(null));

  mock.onAny(/^\/|\/api\//).reply((config) => [200, fallbackDemoResponse(config)]);

  mock.onAny().passThrough();

  return mock;
}

export { successResponse };
