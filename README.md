# Antdv Next Admin

一个基于 Vue 3.5、TypeScript 6、Vite 8 和 antdv-next 的现代化中后台前端脚手架，内置主题系统、国际化、Mock 数据、Pro 组件和常见业务示例。

[![Vue](https://img.shields.io/badge/Vue-3.5-brightgreen.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-purple.svg)](https://vite.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 预览

在线体验(原版): [https://antdv-next-admin.yelog.org/dashboard](https://antdv-next-admin.yelog.org/dashboard)


![系统截图](docs/images/screenshot.png)

## 快速开始

```bash
pnpm install
pnpm run dev
```

开发服务默认运行在 `http://localhost:3000`。

常用验证命令:

```bash
pnpm run lint             # oxlint src mock
pnpm run format:check     # oxfmt --check src mock
pnpm run type-check       # vue-tsc --noEmit
pnpm run test:unit:run    # Vitest one-shot
pnpm run build            # 仅生产构建
pnpm run build:demo       # 在线 Demo 构建，启用浏览器端 Mock
pnpm run build:check      # 类型检查 + 生产构建
pnpm run build:demo:check # 类型检查 + 在线 Demo 构建
pnpm run preview          # 预览生产构建
```

发布或提交前建议执行:

```bash
pnpm run lint && pnpm run format:check && pnpm run type-check && pnpm run test:unit:run && pnpm run build:check
```

## 技术栈

- 核心框架: Vue 3.5、TypeScript 6、Vite 8、Pinia 3、Vue Router 5、vue-i18n 11
- UI 与图标: antdv-next、@antdv-next/icons、Iconify
- 样式体系: CSS Variables、Tailwind CSS 4、SCSS
- 数据与 Mock: Axios、vite-plugin-mock-dev-server、@faker-js/faker
- 编辑器: TipTap、Milkdown、CodeMirror
- 图表: ECharts、vue-echarts
- 工程化: vue-tsc、Vitest、oxlint、oxfmt

## 架构概览

核心执行链路:

```text
src/main.ts
  -> 注册 Pinia / Router / i18n / 全局组件默认属性

src/router/routes.ts
  -> staticRoutes / basicRoutes / notFoundRoute

src/router/guards.ts
  -> 页面标题 / Tabs 初始化 / 菜单访问记录

src/stores/auth.ts
  -> 提供默认用户资料并初始化本地用户状态

src/utils/request.ts
  -> Axios 封装 / 统一响应错误处理
```

关键目录:

```text
src/api/                  # 业务 API 封装
src/assets/styles/        # 全局样式、主题变量、动画、Tailwind 入口
src/components/Layout/    # 后台主布局、菜单、顶部栏、Tabs、设置抽屉
src/components/Pro/       # 配置化 Pro 组件
src/components/Captcha/   # 滑块、旋转、拼图、点选验证码统一导出
src/composables/          # 水印、全屏等组合式函数
src/locales/              # zh-CN / en-US / ja-JP / ko-KR 国际化资源
src/router/               # 路由表与导航守卫
src/stores/               # 按领域拆分的 Pinia stores
src/types/                # API、路由、Pro 组件等共享类型
src/utils/                # 请求、存储、i18n、图标等工具
src/views/                # Dashboard、个人资料、通知、关于、异常页
src/mock/                 # Demo 模式的浏览器端 Mock
mock/data/                # Mock 数据源
mock/handlers/            # Mock 接口处理器
tests/unit/               # Vitest 单元测试
```

## 功能矩阵

| 能力 | 说明 |
| --- | --- |
| 路由系统 | 静态路由、基础业务路由、404 路由 |
| 布局系统 | 垂直/水平布局、响应式侧边栏、面包屑、多标签页、右键菜单、全局搜索 |
| 主题系统 | 亮色、暗色、跟随系统、6 种主题色、灰色模式、色弱模式、CSS Variables 驱动 |
| 国际化 | 支持 `zh-CN`、`en-US`、`ja-JP`、`ko-KR`，非默认语言按需异步加载 |
| Mock 数据 | 覆盖 Dashboard 模块 |
| 内容编辑 | TipTap 富文本、Milkdown Markdown、CodeMirror 代码编辑器 |
| 通用组件 | ProTable、ProForm、ProModal、图表、编辑器、验证码、JSON 输入、i18n 输入、上传等 |
| 工程质量 | strict TypeScript、Vitest、oxlint、oxfmt、vue-tsc、生产构建检查 |

## Pro 组件

`src/components/Pro/` 提供以下配置化组件:

| 组件 | 定位 |
| --- | --- |
| ProTable | 配置化表格，支持请求、搜索、分页、工具栏、列设置、表头过滤和列宽调整 |
| ProForm | 配置化表单，支持网格布局、校验、动态选项和自定义渲染 |
| ProModal | 增强弹窗，支持拖拽、全屏和表单集成 |
| ProDescriptions | 配置化描述列表 |
| ProDetail | 详情页布局和 Tabs |
| ProChart | ECharts 图表封装 |
| ProStatCard | 统计卡片 |
| ProStepForm | 分步表单 |
| ProSplitLayout | 分栏布局 |
| ProUpload | 上传组件封装 |
| ProStatus | dot/tag/badge 状态展示 |
| ProCodeEditor | CodeMirror 代码编辑器 |

ProTable 请求函数需要返回 `ProTableRequestResult`:

```ts
import type {
  ProTableColumn,
  ProFormItem,
  ProTableRequestParams,
  ProTableRequestResult,
} from "@/types/pro";

interface UserRecord {
  id: number;
  name: string;
  status: "active" | "disabled";
  createdAt: string;
}

const columns: ProTableColumn<UserRecord>[] = [
  { title: "姓名", dataIndex: "name", valueType: "text" },
  { title: "状态", dataIndex: "status", valueType: "tag" },
  { title: "创建时间", dataIndex: "createdAt", valueType: "date" },
];

const searchFormItems: ProFormItem[] = [
  { name: "keyword", label: "关键词", type: "input" },
  { name: "status", label: "状态", type: "select", options: statusOptions },
];

async function loadData(
  params: ProTableRequestParams,
): Promise<ProTableRequestResult<UserRecord>> {
  console.log(params);
  return { data: [], total: 0, success: true };
}
```

```vue
<ProTable :columns="columns" :request="loadData" :search="{ formItems: searchFormItems }" />
```

搜索表单推荐通过 `search.formItems` 独立配置（使用 `ProFormItem`），适合搜索条件和表格列不一致或顺序不同的场景；简单列表仍可继续在 `columns` 中使用 `search: true` 快捷生成搜索项。

## 环境变量与后端接入

开发环境通过 `vite-plugin-mock-dev-server` 提供 Mock 服务，接口前缀为 `/api`。
`VITE_USE_MOCK` 目前是环境变量约定，源码不会直接用它切换 Mock；开发环境的
Mock 插件由 `vite.config.ts` 注册:

```bash
VITE_USE_MOCK=true
VITE_API_BASE_URL=/api
```

真实生产构建默认关闭文档中约定的 Mock。发布真实项目时，请将 `.env.production` 中的 API 地址替换为你的后端服务:

```bash
VITE_USE_MOCK=false
VITE_DEMO_MODE=false
VITE_API_BASE_URL=https://your-api-domain.com/api
```

在线 Demo 使用独立的 `.env.demo`。当 `VITE_DEMO_MODE=true` 时，`src/main.ts`
会加载 `src/mock/browser.ts`，通过浏览器端 Mock 支持 GitHub Pages 等纯静态托管:

```bash
VITE_USE_MOCK=true
VITE_DEMO_MODE=true
VITE_API_BASE_URL=/api
```

真实生产发布使用 `pnpm run build`；在线 Demo 发布使用 `pnpm run build:demo`。
不要将 `.env.demo` 作为真实项目的生产配置。

接口响应建议遵循:

```ts
interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}
```

`src/utils/request.ts` 的请求方法会返回 `response.data`，响应中的 `{ code !== 200 }`
会被视为错误。业务 API 方法应按调用方实际消费的数据结构声明类型。

## Mock 数据

开发环境通过 `vite-plugin-mock-dev-server` 提供 `/api` 前缀的 Mock 接口。在线 Demo 模式由 `VITE_DEMO_MODE=true` 启用浏览器端 Mock，并兜底拦截未显式覆盖的 `/api/*` 请求，避免 GitHub Pages 等静态站点请求不存在的后端接口。

已覆盖模块:

- Dashboard: `/api/dashboard/stats`、`/api/dashboard/sales-trend`、`/api/dashboard/user-distribution`、`/api/dashboard/activities`、`/api/dashboard/chart-data`

新增 Mock 接口时通常需要同时新增:

```text
mock/data/[entity].data.ts
mock/handlers/[entity].mock.ts
src/api/[entity].ts
src/types/[entity].ts
```

如果接口需要在静态 Demo 中可用，还需要同步更新 `src/mock/browser.ts`。

## 国际化翻译维护

当前支持 `zh-CN`、`en-US`、`ja-JP`、`ko-KR` 四种语言，默认语言为 `zh-CN`。
国际化入口位于 `src/locales/index.ts`，非默认语言通过动态 import 按需加载，缺失
翻译时回退到 `zh-CN`。四个语言资源文件必须保持相同的 key 结构:

```text
src/locales/zh-CN.ts
src/locales/en-US.ts
src/locales/ja-JP.ts
src/locales/ko-KR.ts
```

### 添加或修改翻译项

1. 先在 `src/locales/zh-CN.ts` 中选择对应业务分组，例如 `common`、`layout`、
   `menu`、`dashboard`，添加新的 key。
2. 在 `en-US.ts`、`ja-JP.ts`、`ko-KR.ts` 的相同层级添加相同 key，并分别填写
   对应语言的文本。不要只修改默认语言，否则其他语言会静默回退到中文。
3. 在组件中使用 `$t('dashboard.newLabel')`、`useI18n().t`，或在 TypeScript
   文件中使用 `src/locales` 导出的 `$t`。路由菜单标题应使用已有的 locale key，
   例如 `menu.dashboard`。
4. 文本包含变量时，四种语言都使用相同的占位符名称，例如
   `$t('common.searchLabel', { label })` 对应资源中的 `搜索{label}`。
5. 完成后切换四种语言手动检查，并运行:

```bash
pnpm run type-check
pnpm run test:unit:run
pnpm run build:check
```

### 删除翻译项

删除某个翻译 key 前，先使用 `rg -n '旧 key' src` 查找代码引用。推荐顺序为:

1. 删除或替换组件、路由和工具中的引用。
2. 从四个语言资源文件的相同位置删除该 key。
3. 对动态 key、菜单标题和错误提示进行手动搜索，避免只删除了静态引用。
4. 切换所有语言确认界面没有出现 key 原文，再运行类型检查和单元测试。

### 添加一种语言

新增语言不只是新增一个资源文件，还必须同步更新语言加载和界面入口:

1. 复制 `src/locales/zh-CN.ts` 为新的语言文件，例如 `src/locales/fr-FR.ts`，
   保持默认导出和完整的嵌套 key 结构，再完成翻译。
2. 修改 `src/locales/index.ts` 中的 `SupportedLocale`、
   `SUPPORTED_LOCALE_VALUES`、`LOCALE_NATIVE_LABELS`、`localeLoaders` 和
   `DAYJS_LOCALE_MAP`。如果 dayjs 支持该语言，还要添加对应的 dayjs locale import。
3. 修改 `src/components/Layout/LanguageSwitch.vue`，增加语言选项。
4. 修改 `src/components/Layout/Header.vue`，增加语言菜单项和切换分支。
5. 修改 `src/App.vue`，添加对应的 Antdv Next locale import 和 `antdLocaleMap` 映射。
6. 更新 README 的语言列表，切换新语言并运行类型检查、单元测试和构建检查。

### 删除一种语言

删除语言时按添加语言的步骤反向处理：删除语言资源文件，并从
`src/locales/index.ts` 的类型、列表、标签、loader、dayjs 映射，以及
`LanguageSwitch.vue`、`Header.vue`、`App.vue` 的映射和菜单中一并移除。检查已有
的 `app-locale` 本地存储值，确保旧值会回退到 `zh-CN`。`zh-CN` 是当前默认语言和
fallback，不应直接删除，除非同时重构默认语言和回退策略。

## 测试

单元测试使用 Vitest，配置在 `vitest.config.ts`:

```bash
pnpm run test:unit       # 监听模式
pnpm run test:unit:run   # 单次运行
```

当前单测覆盖无登录路由、ProTable 请求、搜索、表头过滤和关键词搜索等逻辑。

当前项目没有受 Git 跟踪的 `tests/e2e` 测试目录，也没有 Playwright 依赖。

## 开发约定

- TypeScript 开启 `strict`、`noUnusedLocals` 和 `noUnusedParameters`，不要用无意义的死参数或类型压制掩盖问题。
- 路径别名 `@/` 指向 `src/`。
- 可复用 Vue 组件使用 PascalCase 文件名；路由页面按目录组织，入口通常为 `index.vue`。
- Vue 组件使用 Composition API 和 `<script setup lang="ts">`。
- Pinia Store 使用 setup 语法，并按领域拆分。
- 主题相关样式优先使用 `src/assets/styles/variables.css` 中的 CSS Variables；SCSS 和 Tailwind 可用于局部样式与工具类。
- Antdv 组件通过 `unplugin-vue-components` 和 `AntdvNextResolver` 自动导入，但 `Select`、`DatePicker`、`DateRangePicker` 被排除，相关封装或使用需注意显式处理。
- 全局默认组件属性在 `src/components/Global/defaultComponentProps.ts` 注册，修改基础表单控件行为前应先检查这里。
- 用户资料、语言、主题、Tabs 等状态会持久化到 localStorage；调试路由或菜单问题时可清理本地存储后刷新页面。

## 模块划分

- 工作台与辅助页面: Dashboard、个人资料、通知、关于、异常页
- 通用组件: Pro 组件、编辑器、验证码、JSON 输入、图标和国际化输入

## 许可证

MIT License

## 致谢

- [Vue 3](https://vuejs.org/)
- [Vite](https://vite.dev/)
- [Ant Design Vue](https://antdv.com/)
- [Antdv Next](https://github.com/antdv-next/antdv-next)
- [vue-vben-admin](https://github.com/vbenjs/vue-vben-admin)
- [Ant Design Pro Vue](https://pro.antdv.com/)
