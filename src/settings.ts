import type { ProTableSearch } from '@/types/pro';

export type ProTableDensity = 'large' | 'middle' | 'small' | 'smal';
export type ProTableHeight = '100%' | 'auto' | string | number;

export interface ProTableSearchDefaultSettings {
  columnsPerRow: NonNullable<ProTableSearch['columnsPerRow']>;
}

export interface ProTableDefaultSettings {
  size: ProTableDensity;
  height: ProTableHeight;
  resizable: boolean;
  columnResizable: boolean;
  ellipsis: boolean;
  bordered: boolean;
  fixedHeader: boolean;
  search: ProTableSearchDefaultSettings;
}

export interface InputDefaultSettings {
  allowClear: boolean;
}

export interface SelectDefaultSettings {
  allowClear: boolean;
}

export interface DatePickerDefaultSettings {
  allowClear: boolean;
}

export interface ButtonDefaultSettings {
  size: 'large' | 'middle' | 'small';
}

export interface PreferenceVisibilitySettings {
  /** 是否在偏好设置中显示「AI 对话分屏」选项，仅由开发者配置。 */
  readonly showAiCollab: boolean;
  /** 是否在偏好设置中显示「语言切换」选项，仅由开发者配置。 */
  readonly showLanguageSwitch: boolean;
}

export interface AppDefaultSettings {
  preferences: PreferenceVisibilitySettings;
  proTable: ProTableDefaultSettings;
  input: InputDefaultSettings;
  select: SelectDefaultSettings;
  datePicker: DatePickerDefaultSettings;
  button: ButtonDefaultSettings;
}

export const appDefaultSettings: AppDefaultSettings = {
  // 控制偏好设置中的选项可见性，不写入用户偏好或 localStorage。
  preferences: {
    showAiCollab: true,
    showLanguageSwitch: true,
  },
  proTable: {
    size: 'smal',
    height: 'auto',
    resizable: true,
    columnResizable: true,
    ellipsis: true,
    bordered: true,
    fixedHeader: true,
    search: {
      columnsPerRow: {
        xs: 1,
        sm: 2,
        md: 2,
        lg: 3,
        xl: 3,
      },
    },
  },
  input: {
    allowClear: true,
  },
  select: {
    allowClear: true,
  },
  datePicker: {
    allowClear: true,
  },
  button: {
    size: 'middle',
  },
};
