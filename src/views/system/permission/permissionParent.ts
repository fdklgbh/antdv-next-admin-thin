import type { LocalizedText, Permission } from '@/types/auth';

export type PermissionFormValues = {
  name: string | LocalizedText;
  code: string;
  type: Permission['type'];
  description: string;
  parentId?: string;
  path: string;
  component: string;
  icon: string;
  sort: number;
  status: boolean;
  visible: boolean;
};

/**
 * 解析权限保存时提交的 parentId。
 *
 * 产品语义（客户已确认）：编辑权限时不支持修改父级，始终沿用记录原有的 parentId；
 * 新增权限时使用打开弹窗时设置的 parentId（根节点为 undefined），
 * 不从表单其他字段推断父级。
 */
export function resolvePermissionParentId(
  mode: 'create' | 'edit',
  editingPermission: Pick<Permission, 'parentId'> | null,
  formValues: Pick<PermissionFormValues, 'parentId'>,
): string | undefined {
  if (mode === 'edit') {
    return editingPermission?.parentId;
  }
  return formValues.parentId;
}
