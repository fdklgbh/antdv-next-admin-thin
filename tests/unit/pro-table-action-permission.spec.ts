import type { Permission, User } from '@/types/auth';
import type { ProTableAction } from '@/types/pro';

import { createPinia, setActivePinia } from 'pinia';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { filterActionsByPermission } from '@/components/Pro/ProTable/composables/actionPermission';
import { usePermission } from '@/composables/usePermission';
import { ALL_PERMISSION } from '@/constants/permissions';
import { useAuthStore } from '@/stores/auth';

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

function createUser(permissionCodes: string[]): User {
  return {
    id: '1',
    username: 'tester',
    email: 'tester@example.com',
    displayName: 'Tester',
    avatar: '',
    phone: '',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    roles: [],
    permissions: permissionCodes.map(
      (code): Permission => ({
        id: code,
        code,
        name: code,
        description: '',
        resource: code,
        action: '*',
        type: 'button',
      }),
    ),
  };
}

function mountAuthContext(permissionCodes: string[]) {
  vi.stubGlobal('localStorage', createMemoryStorage());
  vi.stubGlobal('sessionStorage', createMemoryStorage());
  vi.stubGlobal('window', {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
  vi.stubGlobal('document', {
    visibilityState: 'visible',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });

  setActivePinia(createPinia());
  const authStore = useAuthStore();
  authStore.setUserInfo(createUser(permissionCodes));
  return usePermission();
}

function editAction(): ProTableAction {
  return {
    label: '编辑',
    permission: 'system.role.edit',
    onClick: vi.fn(),
  };
}

function deleteAction(): ProTableAction {
  return {
    label: '删除',
    permission: 'system.role.delete',
    onClick: vi.fn(),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('filterActionsByPermission', () => {
  it('always keeps actions without a permission requirement', () => {
    const unrestricted: ProTableAction = { label: '查看', onClick: vi.fn() };
    const result = filterActionsByPermission([unrestricted], () => false);

    expect(result).toEqual([unrestricted]);
  });

  it('hides actions whose permission is not granted', () => {
    const result = filterActionsByPermission([editAction()], () => false);

    expect(result).toEqual([]);
  });

  it('keeps actions whose permission is granted', () => {
    const edit = editAction();
    const result = filterActionsByPermission(
      [edit],
      (permission) => permission === 'system.role.edit',
    );

    expect(result).toEqual([edit]);
  });

  it('keeps every action when the user holds the wildcard permission', () => {
    const edit = editAction();
    const remove = deleteAction();
    const { can } = mountAuthContext([ALL_PERMISSION]);

    expect(filterActionsByPermission([edit, remove], can)).toEqual([edit, remove]);
  });

  it('filters only the unauthorized actions and preserves the remaining order', () => {
    const view = { label: '查看', onClick: vi.fn() } satisfies ProTableAction;
    const edit = editAction();
    const remove = deleteAction();
    const { can } = mountAuthContext(['system.role.edit']);

    const result = filterActionsByPermission([view, edit, remove], can);

    expect(result).toEqual([view, edit]);
    expect(result[0]).toBe(view);
    expect(result[1]).toBe(edit);
  });

  it('hides controlled actions when there is no permission data', () => {
    const edit = editAction();
    const view = { label: '查看', onClick: vi.fn() } satisfies ProTableAction;
    const { can } = mountAuthContext([]);

    expect(filterActionsByPermission([view, edit], can)).toEqual([view]);
  });
});

/**
 * ProTable 通过 hasPermission prop 接收权限判断函数，自身不依赖 Pinia / auth store。
 * 这里锁定该契约：未注入 hasPermission 时保持 fail-closed。
 */
describe('ProTable hasPermission prop contract', () => {
  const resolveCan = (hasPermission?: (permission: string) => boolean) => (permission: string) =>
    hasPermission ? hasPermission(permission) : false;

  it('hides controlled actions when hasPermission is not provided (fail-closed)', () => {
    const edit = editAction();
    const view = { label: '查看', onClick: vi.fn() } satisfies ProTableAction;
    const can = resolveCan(undefined);

    expect(filterActionsByPermission([view, edit], can)).toEqual([view]);
  });

  it('delegates entirely to the injected hasPermission', () => {
    const edit = editAction();
    const remove = deleteAction();
    const injected = vi.fn((permission: string) => permission === 'system.role.edit');
    const can = resolveCan(injected);

    expect(filterActionsByPermission([edit, remove], can)).toEqual([edit]);
    expect(injected).toHaveBeenCalledWith('system.role.edit');
    expect(injected).toHaveBeenCalledWith('system.role.delete');
  });

  it('honours a wildcard decision supplied by the caller', () => {
    const edit = editAction();
    const remove = deleteAction();
    const can = resolveCan(() => true);

    expect(filterActionsByPermission([edit, remove], can)).toEqual([edit, remove]);
  });
});
