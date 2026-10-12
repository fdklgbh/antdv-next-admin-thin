import { describe, expect, it } from 'vitest';

import { resolvePermissionParentId } from '@/views/system/permission/permissionParent';

describe('resolvePermissionParentId', () => {
  it('编辑权限时返回记录原有的 parentId', () => {
    expect(
      resolvePermissionParentId('edit', { parentId: 'parent-1' }, { parentId: 'parent-2' }),
    ).toBe('parent-1');
  });

  it('编辑权限时忽略表单中的 parentId，不因表单值不同而更换父级', () => {
    expect(
      resolvePermissionParentId('edit', { parentId: 'parent-1' }, { parentId: undefined }),
    ).toBe('parent-1');
    expect(
      resolvePermissionParentId('edit', { parentId: undefined }, { parentId: 'parent-2' }),
    ).toBeUndefined();
  });

  it('新增根节点时返回 undefined', () => {
    expect(resolvePermissionParentId('create', null, { parentId: undefined })).toBeUndefined();
  });

  it('新增子菜单时返回打开弹窗时设置的 parentId', () => {
    expect(resolvePermissionParentId('create', null, { parentId: 'parent-1' })).toBe('parent-1');
  });
});
