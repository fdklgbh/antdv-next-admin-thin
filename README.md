# Antdv Next Admin

一个基于 Vue 3.5、TypeScript 6、Vite 8 和 antdv-next 的现代化中后台前端脚手架，内置 RBAC 权限、动态路由、主题系统、国际化、Mock 数据、Pro 组件和常见业务示例。

[![Vue](https://img.shields.io/badge/Vue-3.5-brightgreen.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-purple.svg)](https://vite.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 预览

在线体验(原版): [https://antdv-next-admin.yelog.org/dashboard](https://antdv-next-admin.yelog.org/dashboard)


![系统截图](docs/images/screenshot.png)

默认账号:

```text
管理员: admin / 123456
普通用户: user / 123456
```
## 和原版区别
1. 依赖更新,适配了新版本后，几个页面的错误
2. refresh token 修改为了通过http only 形式，后端直接设置cookie

### 因为 refresh  token 修改，所以无法像原版那样，在线体验
## 快速开始

项目仅支持 pnpm，依赖版本以 `pnpm-lock.yaml` 为准。

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
  -> 注册 Pinia / Router / i18n / directives / 全局组件默认属性

src/router/routes.ts
  -> staticRoutes / basicRoutes / asyncRoutes

src/router/guards.ts
  -> 登录态校验 / 动态路由注入 / 字典预加载 / Tabs 初始化

src/stores/permission.ts
  -> 根据角色与权限过滤 asyncRoutes 并生成菜单

src/utils/request.ts
  -> Axios 封装 / Token 注入 / 401 refresh / 错误跳转
```

关键目录:

```text
src/api/                  # 业务 API 封装
src/assets/styles/        # 全局样式、主题变量、动画、Tailwind 入口
src/components/Layout/    # 后台主布局、菜单、顶部栏、Tabs、设置抽屉
src/components/Pro/       # 配置化 Pro 组件
src/components/Captcha/   # 滑块、旋转、拼图、点选验证码统一导出
src/composables/          # 权限、水印、全屏等组合式函数
src/constants/            # 权限码等常量
src/directives/           # 自定义指令，包括 v-permission
src/locales/              # zh-CN / en-US / ja-JP / ko-KR 国际化资源
src/router/               # 路由表、守卫、权限过滤工具
src/stores/               # 按领域拆分的 Pinia stores
src/types/                # API、路由、Pro 组件等共享类型
src/utils/                # 请求、存储、i18n、图标等工具
src/views/                # 页面与示例
mock/data/                # Mock 数据源
mock/handlers/            # Mock 接口处理器
tests/unit/               # Vitest 单元测试
tests/e2e/                # Playwright starter，依赖未安装
```

## 功能矩阵

| 能力 | 说明 |
| --- | --- |
| 权限系统 | RBAC、动态路由、按钮权限、`v-permission` 指令、`usePermission()` 组合式函数、`PermissionButton` 组件 |
| 路由系统 | 静态路由、基础登录路由、权限动态路由、404 动态路由恢复 |
| 布局系统 | 垂直/水平布局、响应式侧边栏、面包屑、多标签页、右键菜单、全局搜索 |
| 主题系统 | 亮色、暗色、跟随系统、6 种主题色、灰色模式、色弱模式、CSS Variables 驱动 |
| 国际化 | 支持 `zh-CN`、`en-US`、`ja-JP`、`ko-KR`，非默认语言按需异步加载 |
| Mock 数据 | 覆盖认证、用户、角色、权限、部门、字典、配置、文件、日志、Dashboard 等模块 |
| 内容编辑 | TipTap 富文本、Milkdown Markdown、CodeMirror 代码编辑器 |
| 示例体系 | ProTable、复杂表单、主从表、虚拟表格、JSON 输入、i18n 输入、高级筛选、导入导出、请求鉴权、RBAC、可观测性、测试示例等 |
| 工程质量 | strict TypeScript、Vitest、oxlint、oxfmt、vue-tsc、生产构建检查 |

## Pro 组件

`src/components/Pro/` 提供以下配置化组件:

| 组件 | 定位 |
| --- | --- |
| ProTable | 配置化表格，支持请求、搜索、分页、工具栏、列设置、表头过滤、列宽调整、权限动作 |
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

## 权限用法

权限码集中维护在 `src/constants/permissions.ts`，路由 `meta.requiredPermissions`、按钮权限和业务判断应优先复用常量，避免散落字符串。

模板指令:

```vue
<a-button v-permission="'user.create'">创建用户</a-button>
<a-button v-permission="['user.edit', 'user.delete']">操作</a-button>
<a-button v-permission.all="['user.edit', 'user.approve']">审批</a-button>
```

组合式函数:

```ts
const { can, canAll, hasRole } = usePermission();

if (can("user.create")) {
  // 有创建权限
}

if (canAll(["user.edit", "user.approve"])) {
  // 同时拥有编辑和审批权限
}

if (hasRole("admin")) {
  // 管理员角色
}
```

组件方式:

```vue
<PermissionButton permission="user.create">
  <a-button>创建用户</a-button>
</PermissionButton>
```

## 环境变量与后端接入

开发环境默认启用 Vite Mock 服务:

```bash
VITE_USE_MOCK=true
VITE_API_BASE_URL=/api
```

真实生产构建默认关闭 Mock。发布真实项目时，请将 `.env.production` 中的 API 地址替换为你的后端服务:

```bash
VITE_USE_MOCK=false
VITE_DEMO_MODE=false
VITE_API_BASE_URL=https://your-api-domain.com/api
```

在线 Demo 使用独立的 `.env.demo`，通过浏览器端 Mock 支持 GitHub Pages 等纯静态托管:

```bash
VITE_USE_MOCK=true
VITE_DEMO_MODE=true
VITE_API_BASE_URL=/api
```

真实生产发布使用 `pnpm run build`；在线 Demo 发布使用 `pnpm run build:demo`。不要将 `.env.demo` 作为真实项目的生产配置。

接口响应建议遵循:

```ts
interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}
```

`src/utils/request.ts` 中的 `request` 方法返回 `response.data`，业务码 `0` 和 `200` 表示成功。业务错误以保留原始响应的 `AxiosError` 抛出，调用方可读取业务码、HTTP 状态和 `requestId`。

接口错误通过 `src/utils/apiError.ts` 统一解析：优先使用当前语言的 `apiErrors.codes` 文案；未知业务码使用后端中文 `message` 兜底；缺少文案时按 HTTP 状态或网络异常提供本地化提示。新增业务码时同步补齐四种语言包。请求层默认提示错误，页面捕获后使用 `showApiError(error)` 可避免重复弹窗；需要页面自行接管时设置 `skipErrorMessage: true`。成功提示使用页面语言包，不直接展示后端 `message`。

### 刷新失败与登录态

HTTP 状态与业务码分别判断：真实后端未认证为 HTTP 401 / code `20001`，登录凭据错误为 HTTP 401 / code `20004`。现有 Mock 的业务码 `401` 仍由请求层识别，不应将其用于新增后端接口。

| 场景 | 前端处理 |
|---|---|
| 受保护请求返回未认证 | 尝试刷新，原请求最多重试一次 |
| 刷新遇到断网、超时、503 或其他非未认证异常 | 保留登录态，传播原始错误，按配置提示失败 |
| 刷新明确未认证，或重试后仍未认证 | 清理登录态；未设置 `skipRedirect` 时跳转登录页 |
| 登录或刷新接口自身返回未认证 | 直接传播错误，不递归刷新；登录页负责提示 |

对应回归用例位于 `tests/unit/request-service.spec.ts`，覆盖刷新异常分类、登录态清理、跳转及错误传播。修改这些行为后运行 `pnpm run test:unit:run`。多语言提示按展示时的当前语言解析，不根据中文 `message` 匹配业务行为。

## Mock 数据

开发环境通过 `vite-plugin-mock-dev-server` 提供 `/api` 前缀的 Mock 接口。在线 Demo 模式由 `VITE_DEMO_MODE=true` 启用浏览器端 Mock，并兜底拦截未显式覆盖的 `/api/*` 请求，避免 GitHub Pages 等静态站点请求不存在的后端接口。

已覆盖模块:

- 认证: `/api/auth/login`、`/api/auth/logout`、`/api/auth/info`、`/api/auth/refresh`
- 用户: `/api/users`、`/api/users/:id`、`/api/users/batch`、`/api/users/change-password`
- 角色: `/api/roles`
- 权限: `/api/permissions`、`/api/permissions/tree`、`/api/permissions/user`
- 部门: `/api/dept/tree`、`/api/dept/list`、`/api/dept`
- 字典: `/api/dict/types`、`/api/dict/type/list`、`/api/dict/data/list`、`/api/dict/data/:typeCode`
- 配置: `/api/config/list`、`/api/config/key/:key`、`/api/config`
- 文件: `/api/file/list`、`/api/file/:id`、`/api/file/upload`
- 日志: `/api/log/operation/list`、`/api/log/login/list`
- Dashboard: `/api/dashboard/stats`、`/api/dashboard/sales-trend`、`/api/dashboard/user-distribution`、`/api/dashboard/activities`、`/api/dashboard/chart-data`

新增 Mock 接口时通常需要同时新增:

```text
mock/data/[entity].data.ts
mock/handlers/[entity].mock.ts
src/api/[entity].ts
src/types/[entity].ts
```

## 测试

单元测试使用 Vitest，配置在 `vitest.config.ts`:

```bash
pnpm run test:unit       # watch mode
pnpm run test:unit:run   # one-shot
```

当前单测覆盖路由权限过滤、ProTable 请求、搜索、表头过滤和关键词搜索等逻辑。

`tests/e2e/*.spec.ts` 是 Playwright starter，当前项目未安装 Playwright 依赖；如需启用 E2E，需要先补齐依赖、脚本和运行环境。

## 开发约定

- TypeScript 开启 `strict`、`noUnusedLocals` 和 `noUnusedParameters`，不要用无意义的死参数或类型压制掩盖问题。
- 路径别名 `@/` 指向 `src/`。
- 可复用 Vue 组件使用 PascalCase 文件名；路由页面按目录组织，入口通常为 `index.vue`。
- Vue 组件使用 Composition API 和 `<script setup lang="ts">`。
- Pinia Store 使用 setup 语法，并按领域拆分。
- 主题相关样式优先使用 `src/assets/styles/variables.css` 中的 CSS Variables；SCSS 和 Tailwind 可用于局部样式与工具类。
- Antdv 组件通过 `unplugin-vue-components` 和 `AntdvNextResolver` 自动导入，但 `Select`、`DatePicker`、`DateRangePicker` 被排除，相关封装或使用需注意显式处理。
- 全局默认组件属性在 `src/components/Global/defaultComponentProps.ts` 注册，修改基础表单控件行为前应先检查这里。
- Access JWT 有效期为 15 分钟，与过期时间、会话 ID、版本和记住登录状态一起保存在 localStorage 的 `auth_session_v1` 对象中。页面监听 storage 事件并在后台恢复时核对版本；账号变化或退出会重新加载其他页面，旧请求不能跨会话重试。localStorage 不是锁，多页可以同时刷新。
- “记住登录”右侧可选 7/15/30 天，默认 7 天。登录提交 `remember`，勾选时同时提交 `rememberDays`。HttpOnly Refresh Token 在会话期间保持不变，不轮换、不滑动延期；未勾选时使用会话 Cookie，服务端最长保留 24 小时。短期 JWT 在关闭浏览器后仍可能保留至过期。
- 真实后端使用 `code: 0` 表示成功；请求封装也接受现有业务 Mock 的 `code: 200`。登录和刷新响应的 data 包含 `token`、`expiresIn`（秒）、`sessionId`、`remember`，不包含 Refresh Token。退出仅撤销刷新会话，已签发 JWT 到期前仍有效。
- 访问受保护页面时，即使本地没有登录标记，也尝试通过 Cookie 恢复。明确退出后不自动恢复。401 触发刷新、原请求最多重试一次；刷新明确未认证或重试仍未认证时清空登录，网络故障或 5xx 保留会话供重试。
- 真实后端建议同源反向代理部署；HTTPS 下启用 Secure Cookie。跨域部署需另行配置 CORS 和 Cookie 属性。纯浏览器 Demo 的刷新凭据仅存于内存，不能验证跨页 HttpOnly Cookie；本地开发 Mock 支持固定 Cookie、绝对过期与退出撤销，但不是生产鉴权实现。
- 修改 `asyncRoutes`、权限码或角色权限后，建议退出登录或刷新会话再验证，避免旧的动态路由和 Tabs 缓存影响判断。

## 模块划分

- 组织管理: 部门、用户、角色、权限
- 系统管理: 配置、字典、文件、日志
- 示例中心: 快速开始、表单输入、内容编辑、基础交互、业务脚手架、安全工程、集成导航、异常页

## 许可证

MIT License

## 致谢

- [Vue 3](https://vuejs.org/)
- [Vite](https://vite.dev/)
- [Ant Design Vue](https://antdv.com/)
- [Antdv Next](https://github.com/antdv-next/antdv-next)
- [vue-vben-admin](https://github.com/vbenjs/vue-vben-admin)
- [Ant Design Pro Vue](https://pro.antdv.com/)
