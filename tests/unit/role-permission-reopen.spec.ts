import type { Permission } from '@/types/auth';

import { describe, expect, it } from 'vitest';

import {
  collectSelectedPermissionCodes,
  resolveEditablePermissionIds,
} from '@/views/system/role/permissionSelection';

function permission(id: string, code: string, children?: Permission[]): Permission {
  return {
    id,
    code,
    name: { 'zh-CN': code, 'en-US': code },
    description: '',
    resource: code,
    action: 'view',
    type: 'menu',
    children,
  };
}

/**
 * 用真实系统结构建模：
 *   system.menu(10)
 *     system.user.view(11)      <- 菜单/页面级权限
 *       system.user.create(12)  <- 按钮
 *       system.user.edit(13)
 *       system.user.delete(14)
 *     system.role.view(20)
 *       system.role.create(21)
 */
const tree: Permission[] = [
  permission('10', 'system.menu', [
    permission('11', 'system.user.view', [
      permission('12', 'system.user.create'),
      permission('13', 'system.user.edit'),
      permission('14', 'system.user.delete'),
    ]),
    permission('20', 'system.role.view', [permission('21', 'system.role.create')]),
  ]),
];

describe('resolveEditablePermissionIds', () => {
  it('returns an empty array when nothing is granted', () => {
    expect(resolveEditablePermissionIds(tree, [])).toEqual([]);
  });

  it('only returns leaf ids, never menu ids', () => {
    // 菜单 ID（10/11/20）不得下发，否则 rc-tree 会强制勾选其全部子节点。
    expect(resolveEditablePermissionIds(tree, ['10', '11', '13', '14'])).toEqual(['13', '14']);
  });

  it('keeps every granted leaf', () => {
    expect(resolveEditablePermissionIds(tree, ['10', '11', '12', '13', '14'])).toEqual([
      '12',
      '13',
      '14',
    ]);
  });

  it('ignores menu ids even when they are the only granted items', () => {
    // 仅有页面级权限时，v-model 不能放菜单 ID（会让所有按钮被勾上）。
    // 该场景下的页面访问权由保存时的祖先补齐保证，而非靠回填菜单 ID。
    expect(resolveEditablePermissionIds(tree, ['10', '11'])).toEqual([]);
  });

  it('deduplicates while preserving the granted order', () => {
    expect(resolveEditablePermissionIds(tree, ['13', '13', '12'])).toEqual(['13', '12']);
  });
});

describe('collectSelectedPermissionCodes', () => {
  it('keeps the ancestor menu codes when only part of the children are selected', () => {
    // TreeSelect 半选时值里只有叶子，必须补齐祖先菜单/页面权限，
    // 否则角色会失去页面访问权。
    expect(collectSelectedPermissionCodes(tree, ['13', '14'])).toEqual([
      'system.menu',
      'system.user.view',
      'system.user.edit',
      'system.user.delete',
    ]);
  });

  it('does not pull in unselected siblings when completing ancestor codes', () => {
    expect(collectSelectedPermissionCodes(tree, ['13'])).toEqual([
      'system.menu',
      'system.user.view',
      'system.user.edit',
    ]);
  });

  it('expands a selected parent into its whole subtree plus its ancestors', () => {
    expect(collectSelectedPermissionCodes(tree, ['11'])).toEqual([
      'system.menu',
      'system.user.view',
      'system.user.create',
      'system.user.edit',
      'system.user.delete',
    ]);
  });

  it('returns an empty array for an empty tree', () => {
    expect(collectSelectedPermissionCodes([], ['13'])).toEqual([]);
  });

  it('ignores ids that do not exist in the tree while keeping ancestors of real ids', () => {
    expect(collectSelectedPermissionCodes(tree, ['missing', '21'])).toEqual([
      'system.menu',
      'system.role.view',
      'system.role.create',
    ]);
  });

  it('never emits duplicate codes', () => {
    const duplicated: Permission[] = [
      permission('p', 'p.view', [permission('c', 'p.view')]),
    ];
    expect(collectSelectedPermissionCodes(duplicated, ['p', 'c'])).toEqual(['p.view']);
  });

  it('outputs codes in stable pre-order traversal order', () => {
    expect(collectSelectedPermissionCodes(tree, ['21', '13'])).toEqual([
      'system.menu',
      'system.user.view',
      'system.user.edit',
      'system.role.view',
      'system.role.create',
    ]);
  });
});

describe('edit round trip: unchecking a button must stay unchecked', () => {
  it('does not re-check the removed button after save + reopen', () => {
    // 1. 打开编辑：全选状态（整棵用户管理子树都授权）
    const opened = resolveEditablePermissionIds(tree, ['10', '11', '12', '13', '14']);
    expect(opened).toEqual(['12', '13', '14']);
    // 菜单 11 不在 v-model 中，但 rc-tree 会依据三个叶子全勾而显示为全选。

    // 2. 用户取消「新增用户」(12) → TreeSelect 值变成 ['13','14']
    const afterUncheck = ['13', '14'];

    // 3. 保存：补齐祖先，得到后端应存的权限集合
    const savedCodes = collectSelectedPermissionCodes(tree, afterUncheck);
    expect(savedCodes).toEqual([
      'system.menu',
      'system.user.view',
      'system.user.edit',
      'system.user.delete',
    ]);
    expect(savedCodes).not.toContain('system.user.create');

    // 4. 再次打开：用保存下来的 ID 还原 v-model
    const savedIds = ['10', '11', '13', '14'];
    const reopened = resolveEditablePermissionIds(tree, savedIds);

    // 关键：12 不能出现在 v-model 中（否则 rc-tree 会把它勾上）
    expect(reopened).not.toContain('12');
    expect(reopened).toEqual(['13', '14']);
  });

  it('stays stable across repeated save and reopen cycles', () => {
    let ids = ['10', '11', '13', '14'];
    for (let i = 0; i < 3; i += 1) {
      const editable = resolveEditablePermissionIds(tree, ids);
      expect(editable).not.toContain('12');
      const codes = collectSelectedPermissionCodes(tree, editable);
      expect(codes).not.toContain('system.user.create');
      // 用 code 反查 id，模拟后端返回后重新回填
      ids = codes;
    }
  });

  it('keeps every button when the whole subtree is still granted', () => {
    const savedIds = ['10', '11', '12', '13', '14'];
    const reopened = resolveEditablePermissionIds(tree, savedIds);
    expect(reopened).toEqual(['12', '13', '14']);
    const resaved = collectSelectedPermissionCodes(tree, reopened);
    expect(resaved).toEqual([
      'system.menu',
      'system.user.view',
      'system.user.create',
      'system.user.edit',
      'system.user.delete',
    ]);
  });
});
