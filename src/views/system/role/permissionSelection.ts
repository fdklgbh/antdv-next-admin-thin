import type { Permission } from '@/types/auth';

import { resolveLocalizedText } from '@/utils/localizedText';

export type PermissionLabeledValue = {
  label: string;
  value: string;
};

export type PermissionOption = {
  title: string;
  value: string;
  children?: PermissionOption[];
};

type SelectionChangeOptions = {
  /** 勾选父节点时是否同时授予全部后代。角色页使用 false。 */
  includeDescendantsOnCheck?: boolean;
};

/** 构建 TreeSelect 原生 treeData，节点标题必须使用 title 字段。 */
export function buildPermissionOptions(
  permissionTree: Permission[],
  locale: string,
): PermissionOption[] {
  return permissionTree.map((node) => ({
    title: `${formatPermissionName(node.name, locale)} (${node.code})`,
    value: node.id,
    children: node.children?.length ? buildPermissionOptions(node.children, locale) : undefined,
  }));
}

/** 仅承载子路由的 Layout 节点，按分组处理全选和反选。 */
export function isPermissionGroup(permission: Permission): boolean {
  return permission.type === 'menu' && permission.component === 'Layout';
}

function formatPermissionName(name: Permission['name'], locale: string): string {
  return typeof name === 'string' ? name : resolveLocalizedText(name, locale);
}

function collectPermissionMap(permissionTree: Permission[]): Map<string, Permission> {
  const permissionMap = new Map<string, Permission>();
  const traverse = (nodes: Permission[]): void => {
    for (const node of nodes) {
      permissionMap.set(node.id, node);
      traverse(node.children ?? []);
    }
  };
  traverse(permissionTree);
  return permissionMap;
}

function collectPreorderIds(nodes: Permission[]): string[] {
  return nodes.flatMap((node) => [node.id, ...collectPreorderIds(node.children ?? [])]);
}

function findPermissionNode(
  nodes: Permission[],
  id: string,
  ancestors: Permission[] = [],
): { node: Permission; ancestors: Permission[] } | undefined {
  for (const node of nodes) {
    if (node.id === id) {
      return { node, ancestors };
    }
    const child = findPermissionNode(node.children ?? [], id, [...ancestors, node]);
    if (child) {
      return child;
    }
  }
  return undefined;
}

function collectSubtreeIds(node: Permission, target: Set<string>): void {
  target.add(node.id);
  for (const child of node.children ?? []) {
    collectSubtreeIds(child, target);
  }
}

function removeSubtreeIds(node: Permission, target: Set<string>): void {
  target.delete(node.id);
  for (const child of node.children ?? []) {
    removeSubtreeIds(child, target);
  }
}

function hasSelectedDescendant(node: Permission, selectedIds: Set<string>): boolean {
  return (node.children ?? []).some(
    (child) => selectedIds.has(child.id) || hasSelectedDescendant(child, selectedIds),
  );
}

/**
 * 顶层分组是否勾选完全由后代决定：只要下面还有选中项就勾选，
 * 下面全部取消后自动取消，不单独保留一个空分组值。
 */
function normalizeGroupSelections(nodes: Permission[], selectedIds: Set<string>): void {
  for (const node of nodes) {
    normalizeGroupSelections(node.children ?? [], selectedIds);
    if (!isPermissionGroup(node)) {
      continue;
    }
    if (hasSelectedDescendant(node, selectedIds)) {
      selectedIds.add(node.id);
    } else {
      selectedIds.delete(node.id);
    }
  }
}

function normalizeSelectionIds(permissionTree: Permission[], selectedIds: string[]): string[] {
  const normalizedIds = new Set(selectedIds);
  normalizeGroupSelections(permissionTree, normalizedIds);
  return collectPreorderIds(permissionTree).filter((id) => normalizedIds.has(id));
}

/** 将 TreeSelect 严格勾选返回的 LabeledValue 或旧版字符串值归一化为权限 ID。 */
export function normalizePermissionSelection(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    const rawValue =
      item && typeof item === 'object' && 'value' in item
        ? (item as { value?: unknown }).value
        : item;
    if (typeof rawValue !== 'string' && typeof rawValue !== 'number') {
      continue;
    }

    const id = String(rawValue);
    if (!seen.has(id)) {
      seen.add(id);
      normalized.push(id);
    }
  }
  return normalized;
}

/**
 * 将已授权权限还原为 TreeSelect 严格勾选所需的 LabeledValue。
 *
 * 页面 view 与按钮权限必须分别回填：如果把 view 交给非严格联动，组件会
 * 把页面下全部按钮一起选中；只回填叶子则会在按钮清空时丢掉 view。
 */
export function resolveEditablePermissionSelections(
  permissionTree: Permission[],
  grantedIds: string[],
  locale: string,
): PermissionLabeledValue[] {
  const permissionMap = collectPermissionMap(permissionTree);
  const selections: PermissionLabeledValue[] = [];
  const seen = new Set<string>();

  const normalizedIds = normalizeSelectionIds(permissionTree, grantedIds);
  for (const id of normalizedIds) {
    const permission = permissionMap.get(id);
    if (!permission || seen.has(id)) {
      continue;
    }
    seen.add(id);
    selections.push({
      label: formatPermissionName(permission.name, locale),
      value: permission.id,
    });
  }
  return selections;
}

/**
 * 处理一次权限勾选变化。
 *
 * 规则：
 * - 勾选页面/菜单：只授予节点自身（角色页不自动授予按钮）；
 * - 勾选按钮：补齐其祖先访问路径；
 * - 取消页面/菜单：取消其自身及全部后代；
 * - 取消按钮：只取消自身，不反推页面 view。
 */
export function resolvePermissionSelectionChange(
  permissionTree: Permission[],
  selectedIds: unknown,
  changedId: unknown,
  checked: boolean,
  locale: string,
  options: SelectionChangeOptions = {},
): PermissionLabeledValue[] {
  const currentIds = normalizePermissionSelection(selectedIds);
  if (typeof changedId !== 'string' && typeof changedId !== 'number') {
    return resolveEditablePermissionSelections(permissionTree, currentIds, locale);
  }

  const changed = findPermissionNode(permissionTree, String(changedId));
  if (!changed) {
    return resolveEditablePermissionSelections(permissionTree, currentIds, locale);
  }

  const nextIds = new Set(currentIds);
  if (checked) {
    if (isPermissionGroup(changed.node)) {
      collectSubtreeIds(changed.node, nextIds);
    } else {
      nextIds.add(changed.node.id);
      for (const ancestor of changed.ancestors) {
        nextIds.add(ancestor.id);
      }
    }
    if (options.includeDescendantsOnCheck) {
      collectSubtreeIds(changed.node, nextIds);
    }
  } else {
    removeSubtreeIds(changed.node, nextIds);
  }

  return resolveEditablePermissionSelections(
    permissionTree,
    normalizeSelectionIds(permissionTree, [...nextIds]),
    locale,
  );
}

/**
 * 将角色权限选择保存为后端使用的 code 列表。
 *
 * 选择树是严格模式，勾选值就是用户实际选择的节点。保存时只补齐进入页面
 * 所需的祖先菜单路径，不展开未勾选的按钮；取消页面时会由选择变更逻辑
 * 一并清理后代。
 */
export function collectSelectedPermissionCodes(
  permissionTree: Permission[],
  selectedIds: unknown,
): string[] {
  const explicitIds = new Set(normalizePermissionSelection(selectedIds));
  const requiredIds = new Set<string>();

  const collectAncestors = (nodes: Permission[], ancestors: Permission[]): void => {
    for (const node of nodes) {
      if (explicitIds.has(node.id)) {
        requiredIds.add(node.id);
        for (const ancestor of ancestors) {
          requiredIds.add(ancestor.id);
        }
      }
      collectAncestors(node.children ?? [], [...ancestors, node]);
    }
  };
  collectAncestors(permissionTree, []);

  const collectedCodes: string[] = [];
  const seenCodes = new Set<string>();
  const collectNodes = (nodes: Permission[]): void => {
    for (const node of nodes) {
      if (requiredIds.has(node.id) && !seenCodes.has(node.code)) {
        seenCodes.add(node.code);
        collectedCodes.push(node.code);
      }
      collectNodes(node.children ?? []);
    }
  };
  collectNodes(permissionTree);

  return collectedCodes;
}

/**
 * 为 TreeSelect 的标签渲染解析一个安全的显示文本。
 *
 * 已选中的节点可能不在当前权限树里（例如权限被移除后残留的角色数据），
 * 此时 nodeData.title 为 undefined/null/''，且 permissionMap 也查不到该 ID；
 * 必须以节点 ID 兜底，避免渲染出 'undefined'/'null' 或读取 undefined.title 抛错。
 */
export function resolvePermissionNodeTitle(
  nodeData?: { value?: unknown; title?: unknown } | null,
): string {
  if (nodeData == null) {
    return '';
  }
  const fallbackId = nodeData.value == null ? '' : String(nodeData.value);
  const rawTitle = nodeData.title;
  if (typeof rawTitle === 'string' && rawTitle.length > 0) {
    return rawTitle;
  }
  if (typeof rawTitle === 'number') {
    return String(rawTitle);
  }
  return fallbackId;
}
