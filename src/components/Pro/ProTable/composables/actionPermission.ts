import type { ProTableAction } from '@/types/pro';

/**
 * Filter ProTable row actions by the current user's permissions.
 *
 * Actions without a `permission` requirement are always kept; actions with a
 * requirement are kept only when `hasPermission` returns true for that code.
 * The caller is responsible for handling the ALL_PERMISSION wildcard (the
 * existing usePermission composable already does).
 */
export function filterActionsByPermission<T extends ProTableAction>(
  actions: T[],
  hasPermission: (permission: string) => boolean,
): T[] {
  return actions.filter((action) => !action.permission || hasPermission(action.permission));
}
