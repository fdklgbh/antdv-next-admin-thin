import type { Role } from '@/types/auth';

/** 超级管理员角色码：独占最高优先级，任何人都不能管理。 */
export const SUPER_ADMIN_CODE = 'super_admin';

/** 新建/编辑角色时允许的优先级上限（super_admin 独占 100）。 */
export const MAX_ASSIGNABLE_ROLE_LEVEL = 99;

/**
 * 计算当前登录用户的最高角色优先级。
 * 无角色或角色缺少 level 时按 0（最低）处理。
 */
export function getHighestRoleLevel(roles: Pick<Role, 'level'>[] | undefined | null): number {
  return (roles ?? []).reduce((highest, role) => Math.max(highest, role.level ?? 0), 0);
}

/**
 * 判断某个角色是否可被"权限级别为 myLevel 的操作者"管理。
 * 规则与真实后端 requireManageableRole 保持一致：
 *   1) super_admin 角色任何人都不能管理；
 *   2) 只能管理优先级严格低于自己的角色（同级与更高都不可管理）。
 */
export function canManageRole(
  record: Pick<Role, 'code' | 'level'>,
  myLevel: number,
): boolean {
  if (record.code === SUPER_ADMIN_CODE) return false;
  return (record.level ?? 0) < myLevel;
}

/**
 * 从角色列表中筛出可分配给用户的角色。
 * 与后端 SaveUser 的角色分配约束一致：不能分配 super_admin 及不高于自己的角色。
 */
export function filterAssignableRoles<T extends Pick<Role, 'code' | 'level'>>(
  roles: T[],
  myLevel: number,
): T[] {
  return roles.filter((role) => canManageRole(role, myLevel));
}

/** 校验优先级是否为 0~99 的整数。 */
export function isValidRoleLevel(level: unknown): boolean {
  const numeric = Number(level);
  return Number.isInteger(numeric) && numeric >= 0 && numeric <= MAX_ASSIGNABLE_ROLE_LEVEL;
}
