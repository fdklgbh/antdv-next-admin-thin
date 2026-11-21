import type { Permission } from '@/types/auth';

import { describe, expect, it } from 'vitest';

import {
  collectSelectedPermissionCodes,
  normalizePermissionSelection,
  resolveEditablePermissionSelections,
  resolvePermissionSelectionChange,
} from '@/views/system/role/permissionSelection';

function permission(
  id: string,
  code: string,
  children?: Permission[],
  component?: string,
): Permission {
  return {
    id,
    code,
    name: { 'zh-CN': code, 'en-US': code },
    description: '',
    resource: code,
    action: 'view',
    type: 'menu',
    component,
    children,
  };
}

/**
 * 用真实系统结构建模：
 *   system.menu(10)
 *     system.user.view(11)
 *       system.user.create(12)
 *       system.user.edit(13)
 *       system.user.delete(14)
 *     system.role.view(20)
 *       system.role.create(21)
 */
const tree: Permission[] = [
  permission(
    '10',
    'system.menu',
    [
      permission('11', 'system.user.view', [
        permission('12', 'system.user.create'),
        permission('13', 'system.user.edit'),
        permission('14', 'system.user.delete'),
      ]),
      permission('20', 'system.role.view', [permission('21', 'system.role.create')]),
    ],
    'Layout',
  ),
];

const values = (selections: Array<{ value: string }>): string[] =>
  selections.map((selection) => selection.value);

describe('normalizePermissionSelection', () => {
  it('normalizes strict TreeSelect labeled values to permission ids', () => {
    expect(
      normalizePermissionSelection([
        { label: 'User Management', value: '11' },
        { label: 'Edit User', value: '13' },
      ]),
    ).toEqual(['11', '13']);
  });

  it('keeps backward compatibility with string values and removes duplicates', () => {
    expect(normalizePermissionSelection(['11', '13', '11'])).toEqual(['11', '13']);
  });

  it('ignores invalid values', () => {
    expect(normalizePermissionSelection(undefined)).toEqual([]);
    expect(normalizePermissionSelection(['11', null, {}])).toEqual(['11']);
  });
});

describe('resolveEditablePermissionSelections', () => {
  it('returns an empty array when nothing is granted', () => {
    expect(resolveEditablePermissionSelections(tree, [], 'en-US')).toEqual([]);
  });

  it('keeps view and button ids as separate strict selections', () => {
    expect(resolveEditablePermissionSelections(tree, ['10', '11', '13', '14'], 'en-US')).toEqual([
      { label: 'system.menu', value: '10' },
      { label: 'system.user.view', value: '11' },
      { label: 'system.user.edit', value: '13' },
      { label: 'system.user.delete', value: '14' },
    ]);
  });

  it('keeps a view permission when every button below it is removed', () => {
    expect(resolveEditablePermissionSelections(tree, ['10', '11'], 'en-US')).toEqual([
      { label: 'system.menu', value: '10' },
      { label: 'system.user.view', value: '11' },
    ]);
  });

  it('checks a group automatically when any descendant is selected', () => {
    expect(resolveEditablePermissionSelections(tree, ['11'], 'en-US')).toEqual([
      { label: 'system.menu', value: '10' },
      { label: 'system.user.view', value: '11' },
    ]);
  });

  it('drops a group that has no selected descendants', () => {
    expect(resolveEditablePermissionSelections(tree, ['10'], 'en-US')).toEqual([]);
  });
});

describe('resolvePermissionSelectionChange', () => {
  it('does not grant child buttons when a page view is checked', () => {
    const selections = resolvePermissionSelectionChange(tree, ['10'], '11', true, 'en-US');
    expect(values(selections)).toEqual(['10', '11']);
  });

  it('keeps the page view when the last child button is unchecked', () => {
    let selections = resolveEditablePermissionSelections(
      tree,
      ['10', '11', '12', '13', '14'],
      'en-US',
    );
    for (const id of ['12', '13', '14']) {
      selections = resolvePermissionSelectionChange(tree, selections, id, false, 'en-US');
    }
    expect(values(selections)).toEqual(['10', '11']);
  });

  it('removes all descendants when a page view is unchecked', () => {
    const selections = resolvePermissionSelectionChange(
      tree,
      ['10', '11', '12', '13', '14', '20', '21'],
      '11',
      false,
      'en-US',
    );
    expect(values(selections)).toEqual(['10', '20', '21']);
  });

  it('adds the ancestor access path when a button is checked', () => {
    const selections = resolvePermissionSelectionChange(tree, [], '13', true, 'en-US');
    expect(values(selections)).toEqual(['10', '11', '13']);
  });

  it('selects the whole subtree when a group is checked', () => {
    const selections = resolvePermissionSelectionChange(tree, [], '10', true, 'en-US');
    expect(values(selections)).toEqual(['10', '11', '12', '13', '14', '20', '21']);
  });

  it('unchecks a group after every descendant is removed', () => {
    let selections = resolveEditablePermissionSelections(
      tree,
      ['10', '11', '12', '13', '14'],
      'en-US',
    );
    selections = resolvePermissionSelectionChange(tree, selections, '11', false, 'en-US');
    expect(values(selections)).toEqual([]);
  });
});

describe('collectSelectedPermissionCodes', () => {
  it('keeps the selected page view and its access path without child buttons', () => {
    expect(collectSelectedPermissionCodes(tree, ['10', '11'])).toEqual([
      'system.menu',
      'system.user.view',
    ]);
  });

  it('does not pull in unselected siblings when completing ancestor codes', () => {
    expect(collectSelectedPermissionCodes(tree, ['13'])).toEqual([
      'system.menu',
      'system.user.view',
      'system.user.edit',
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
    const duplicatedTree: Permission[] = [permission('p', 'p.view', [permission('c', 'p.view')])];
    expect(collectSelectedPermissionCodes(duplicatedTree, ['p', 'c'])).toEqual(['p.view']);
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
