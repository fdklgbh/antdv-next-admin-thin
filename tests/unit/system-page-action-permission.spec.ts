import { describe, expect, it } from 'vitest';

import { filterActionsByPermission } from '@/components/Pro/ProTable/composables/actionPermission';

/**
 * 系统管理各页面「写操作按钮」的权限契约。
 *
 * 背景：用户/角色/权限三页之外，config / dict / file / log 四页的按钮曾漏加权限控制，
 * 导致去掉权限后按钮仍然可见（已修复）。这里把各页的权限码契约固化下来。
 */
const PAGE_ACTIONS: Record<string, { label: string; permission: string }[]> = {
  用户管理: [
    { label: '导入', permission: 'system.user.create' },
    { label: '创建用户', permission: 'system.user.create' },
    { label: '编辑', permission: 'system.user.edit' },
    { label: '删除', permission: 'system.user.delete' },
  ],
  角色管理: [
    { label: '创建角色', permission: 'system.role.create' },
    { label: '编辑', permission: 'system.role.edit' },
    { label: '删除', permission: 'system.role.delete' },
  ],
  菜单管理: [
    { label: '新增菜单', permission: 'system.permission.create' },
    { label: '新增子级', permission: 'system.permission.create' },
    { label: '编辑', permission: 'system.permission.edit' },
    { label: '删除', permission: 'system.permission.delete' },
  ],
  系统配置: [
    { label: '新增配置', permission: 'system.config.create' },
    { label: '编辑', permission: 'system.config.edit' },
    { label: '删除', permission: 'system.config.delete' },
  ],
  数据字典: [
    { label: '新增', permission: 'system.dict.create' },
    { label: '新增数据', permission: 'system.dict.create' },
    { label: '编辑', permission: 'system.dict.edit' },
    { label: '删除', permission: 'system.dict.delete' },
  ],
  文件管理: [
    { label: '上传', permission: 'system.file.upload' },
    { label: '删除', permission: 'system.file.delete' },
  ],
  系统日志: [{ label: '清空日志', permission: 'system.log.clear' }],
};

const grants = (codes: string[]) => (code: string) => codes.includes('*') || codes.includes(code);

describe('system page write-action permission gating', () => {
  it.each(Object.entries(PAGE_ACTIONS))(
    'hides every write action of %s when the account only has view permission',
    (page, actions) => {
      // 仅给该模块的 view 权限，所有写操作都应被过滤掉。
      const viewCode = actions[0].permission.replace(/\.(create|edit|delete|upload|clear)$/, '.view');
      const result = filterActionsByPermission(actions, grants([viewCode]));
      expect(result, page).toEqual([]);
    },
  );

  it.each(Object.entries(PAGE_ACTIONS))(
    'shows every write action of %s when all its permissions are granted',
    (page, actions) => {
      const allCodes = [...new Set(actions.map((action) => action.permission))];
      const result = filterActionsByPermission(actions, grants(allCodes));
      expect(result.map((action) => action.label), page).toEqual(
        actions.map((action) => action.label),
      );
    },
  );

  it.each(Object.entries(PAGE_ACTIONS))(
    'shows every write action of %s for the wildcard account',
    (page, actions) => {
      const result = filterActionsByPermission(actions, grants(['*']));
      expect(result, page).toHaveLength(actions.length);
    },
  );
});
