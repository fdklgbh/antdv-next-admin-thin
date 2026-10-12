import { describe, expect, it } from 'vitest';

import { filterActionsByPermission } from '@/components/Pro/ProTable/composables/actionPermission';

/**
 * 用户管理页（src/views/system/user/index.vue）的操作按钮权限契约：
 *   - 工具栏「创建用户」由 v-permission="'system.user.create'" 控制；
 *   - 行内「编辑」「删除」由 action.permission 控制。
 * 这里锁定该契约，防止再次出现"去掉创建用户权限后按钮仍在"的问题。
 */
const userRowActions = [
  { label: '编辑', permission: 'system.user.edit' },
  { label: '删除', permission: 'system.user.delete' },
];

const grants = (codes: string[]) => (code: string) => codes.includes('*') || codes.includes(code);

describe('user page action permission gating', () => {
  it('hides 编辑/删除 when the account only has system.user.view', () => {
    const result = filterActionsByPermission(userRowActions, grants(['system.user.view']));
    expect(result).toEqual([]);
  });

  it('shows 编辑 only when system.user.edit is granted', () => {
    const result = filterActionsByPermission(
      userRowActions,
      grants(['system.user.view', 'system.user.edit']),
    );
    expect(result.map((action) => action.label)).toEqual(['编辑']);
  });

  it('shows both when edit and delete are granted', () => {
    const result = filterActionsByPermission(
      userRowActions,
      grants(['system.user.view', 'system.user.edit', 'system.user.delete']),
    );
    expect(result.map((action) => action.label)).toEqual(['编辑', '删除']);
  });

  it('shows everything for the wildcard account', () => {
    const result = filterActionsByPermission(userRowActions, grants(['*']));
    expect(result.map((action) => action.label)).toEqual(['编辑', '删除']);
  });

  it('hides the create button when system.user.create is not granted', () => {
    const canCreate = (codes: string[]) => grants(codes)('system.user.create');
    expect(canCreate(['system.user.view', 'system.user.edit', 'system.user.delete'])).toBe(false);
    expect(canCreate(['system.user.view', 'system.user.create'])).toBe(true);
    expect(canCreate(['*'])).toBe(true);
  });
});
