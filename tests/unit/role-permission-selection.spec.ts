import type { Permission } from '@/types/auth';

import { describe, expect, it } from 'vitest';

import { collectSelectedPermissionCodes } from '@/views/system/role/permissionSelection';

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

describe('collectSelectedPermissionCodes', () => {
  const tree: Permission[] = [
    permission('a', 'a.view', [
      permission('a1', 'a.create'),
      permission('a2', 'a.delete'),
      permission('a3', 'a.export', [permission('a3-1', 'a.export.run')]),
    ]),
    permission('b', 'b.view', [permission('b1', 'b.create')]),
  ];

  it('returns only the selected parent and its required ancestors', () => {
    expect(collectSelectedPermissionCodes(tree, ['a'])).toEqual(['a.view']);
  });

  it('keeps ancestor menu codes when only part of the children are selected', () => {
    expect(collectSelectedPermissionCodes(tree, ['a1', 'a3-1'])).toEqual([
      'a.view',
      'a.create',
      'a.export',
      'a.export.run',
    ]);
  });

  it('does not pull in unselected siblings when completing ancestor codes', () => {
    expect(collectSelectedPermissionCodes(tree, ['a1'])).toEqual(['a.view', 'a.create']);
  });

  it('returns only explicitly selected nodes and their ancestors', () => {
    expect(collectSelectedPermissionCodes(tree, ['a', 'a2'])).toEqual(['a.view', 'a.delete']);
  });

  it('returns an empty array for an empty tree', () => {
    expect(collectSelectedPermissionCodes([], ['a1'])).toEqual([]);
  });

  it('ignores ids that do not exist in the tree without affecting other selections', () => {
    expect(collectSelectedPermissionCodes(tree, ['missing', 'b1'])).toEqual(['b.view', 'b.create']);
  });

  it('never emits duplicate codes when a parent and its children are selected', () => {
    const duplicatedTree: Permission[] = [
      permission('p', 'p.view', [permission('c', 'p.view')]),
      permission('d', 'd.view', [permission('e', 'd.view')]),
    ];

    expect(collectSelectedPermissionCodes(duplicatedTree, ['p', 'c', 'd', 'e'])).toEqual([
      'p.view',
      'd.view',
    ]);
  });

  it('outputs codes in stable pre-order traversal order', () => {
    expect(collectSelectedPermissionCodes(tree, ['b1', 'a2'])).toEqual([
      'a.view',
      'a.delete',
      'b.view',
      'b.create',
    ]);
  });
});
