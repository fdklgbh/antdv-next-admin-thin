import type { Permission } from '@/types/auth';

/** 收集权限树中所有叶子节点（无子节点的权限，通常是按钮/接口级）。 */
function collectLeafIds(nodes: Permission[]): Set<string> {
  const leafIds = new Set<string>();
  const walk = (list: Permission[]) => {
    for (const node of list) {
      const children = node.children ?? [];
      if (children.length === 0) {
        leafIds.add(node.id);
      } else {
        walk(children);
      }
    }
  };
  walk(nodes);
  return leafIds;
}

/**
 * 将角色已持有的权限 ID 还原成 TreeSelect 的 v-model 值。
 *
 * TreeSelect（rc-tree）非严格勾选模式下 v-model 存在强制联动：
 *   - 节点在 v-model 中 → 其全部后代被强制勾选；
 *   - 全部子节点被勾选 → 父节点被强制加入 v-model。
 *
 * 而角色权限里同时包含「菜单/页面级权限」与「按钮级权限」，菜单权限只是
 * 为了让角色能进入页面而存在的祖先节点。若把菜单 ID 放进 v-model，rc-tree
 * 会把该菜单下【所有】按钮一并勾上，导致用户取消过的按钮权限再次出现
 * （线上问题：取消「新增用户」后重开编辑又被勾选）。
 *
 * 因此 v-model 只下发叶子节点：
 *   - 菜单节点的勾选/半选状态由 rc-tree 依据叶子自动推导；
 *   - 叶子节点本身代表用户真实勾选过的按钮权限，不会凭空多出权限。
 *
 * 保存时再由 collectSelectedPermissionCodes 补齐祖先菜单权限，
 * 保证角色既能进入页面、又不越权拥有按钮权限。
 */
export function resolveEditablePermissionIds(
  permissionTree: Permission[],
  grantedIds: string[],
): string[] {
  const granted = new Set(grantedIds);
  const leafIds = collectLeafIds(permissionTree);

  const editableIds: string[] = [];
  const seen = new Set<string>();
  for (const id of grantedIds) {
    if (!granted.has(id) || seen.has(id)) {
      continue;
    }
    if (leafIds.has(id)) {
      seen.add(id);
      editableIds.push(id);
    }
  }
  return editableIds;
}

/**
 * 将 TreeSelect 的选中 ID 汇总为角色保存所需的权限 code 列表。
 *
 * TreeSelect 在「非严格勾选 + SHOW_PARENT」下的取值语义：
 *   - 某节点被完整勾选时，值里只保留该节点 ID（其后代被折叠隐藏）；
 *   - 某节点处于半选状态时，值里只有被勾选的叶子，父节点 ID 不在其中。
 *
 * 若直接使用 TreeSelect 的值，第二种情况会丢掉「菜单/页面级」权限，
 * 导致角色失去页面访问权（例如取消「新增用户」后连用户管理页都进不去）。
 *
 * 因此这里按以下规则归一化：
 *   1. 显式选中的节点：输出自身 + 全部后代（还原 SHOW_PARENT 折叠的部分）；
 *   2. 显式选中节点的祖先：只输出祖先自身，不展开其未选中的后代；
 *   3. 结果按权限树前序遍历顺序去重输出。
 */
export function collectSelectedPermissionCodes(
  permissionTree: Permission[],
  selectedIds: string[],
): string[] {
  const explicitIds = new Set(selectedIds);
  const requiredIds = new Set<string>();

  const markSubtree = (node: Permission): void => {
    requiredIds.add(node.id);
    for (const child of node.children ?? []) {
      markSubtree(child);
    }
  };
  const collectSubtree = (nodes: Permission[]): void => {
    for (const node of nodes) {
      if (explicitIds.has(node.id)) {
        markSubtree(node);
      }
      if (node.children && node.children.length > 0) {
        collectSubtree(node.children);
      }
    }
  };
  collectSubtree(permissionTree);

  const collectAncestors = (nodes: Permission[], ancestors: string[]): void => {
    for (const node of nodes) {
      if (explicitIds.has(node.id)) {
        for (const ancestorId of ancestors) {
          requiredIds.add(ancestorId);
        }
      }
      if (node.children && node.children.length > 0) {
        collectAncestors(node.children, [...ancestors, node.id]);
      }
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
      if (node.children && node.children.length > 0) {
        collectNodes(node.children);
      }
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
  // 部分渲染路径可能以 undefined/null 调用（例如 rc-tree 对缺失节点的标签解析）。
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
