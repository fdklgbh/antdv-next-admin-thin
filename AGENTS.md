# Antdv Next Admin - Agent Guidelines

Vue 3 + TypeScript + antdv-next 中后台模板，后续项目在此基础上裁剪和扩展。当前为精简版，只保留认证、权限、布局、主题、国际化、系统管理和 Mock 等基础能力。除技术术语、代码标识符、命令和路径外，沟通、注释及文档默认使用中文。

修改前先阅读目标文件及调用方，只修改当前任务所需文件；不要恢复已删除的示例页面或无关依赖。

## 项目结构

```text
src/
├── api/                  # 按业务域拆分的接口封装
├── assets/styles/        # 全局样式、主题变量、动画与 Tailwind 入口
├── components/           # 布局、Pro、权限、编辑器等可复用组件
├── composables/          # usePermission、useWatermark 等组合式函数
├── config/               # 应用运行配置
├── constants/            # 权限码等稳定常量
├── directives/           # v-permission 等自定义指令
├── locales/              # zh-CN / en-US / ja-JP / ko-KR
├── mock/                 # 浏览器端 Demo Mock
├── router/               # 路由表、守卫、路由恢复与工具
├── stores/               # 按领域拆分的 Pinia setup stores
├── themes/               # 主题预设
├── types/                # API、路由、Pro 组件等共享类型
├── utils/                # 请求、会话、存储、错误处理等工具
└── views/                # dashboard、organization、system 及基础页面
mock/
├── data/                 # Mock 数据源
└── handlers/             # 开发服务器 Mock 接口
tests/unit/               # Vitest 单元测试
```

当前没有示例中心；`src/views` 不应重新加入 `examples/`。仓库当前只有 Vitest 单元测试，未配置可运行的 E2E 测试。

## 常用命令

```bash
pnpm install
pnpm run dev               # http://localhost:3000
pnpm run type-check
pnpm run lint
pnpm run format:check
pnpm run test:unit:run
pnpm run build
pnpm run build:check
pnpm run build:demo        # 静态 Demo 构建，启用浏览器端 Mock
pnpm run build:demo:check
pnpm run preview
```

提交或 PR 前至少执行：

```bash
pnpm run type-check
pnpm run lint
pnpm run test:unit:run
pnpm run build
```

涉及 RBAC、认证或请求刷新逻辑时，除上述命令外还要补充对应回归测试；不要用手工验证替代已有自动化测试。若命令因本机环境或权限限制无法执行，必须说明失败原因和未验证范围，不能把未执行视为通过。

## 环境与 Mock

- `.env.development` 当前默认 `VITE_USE_MOCK=false`，通过 `API_PROXY_TARGET` 连接真实后端；不要把“开发默认启用 Mock”写回文档或代码。
- `.env.demo` 使用 `VITE_USE_MOCK=true`、`VITE_DEMO_MODE=true`，由 `src/mock/browser.ts` 支持静态 Demo。
- `mock/` 用于开发服务器 Mock；`src/mock/browser.ts` 用于静态 Demo 的 `axios-mock-adapter` 拦截。
- 所有 Mock 接口统一使用 `/api` 前缀。新增接口时同步维护数据、处理器、API 封装和类型。
- 不提交敏感环境变量；本地覆盖使用 `.env.local` 或对应 `.env.*.local`。
- Mock 账号：`admin/123456` 拥有完整权限，`user/123456` 为普通用户。

## 代码约定

### 格式与 TypeScript

- 2 空格缩进、LF、UTF-8、文件末尾换行。
- 开启 `strict`、`noUnusedLocals`、`noUnusedParameters`。
- 使用 `@/` 指向 `src/`。
- 公共函数和 composable 提供明确返回类型；共享类型放 `src/types/`。
- 禁止使用 `as any`、`@ts-ignore`、`@ts-expect-error` 规避类型错误。
- 遵循 oxfmt 配置：单引号、分号、尾逗号、100 字符行宽，并让 oxfmt 整理导入顺序。
- oxlint 覆盖 `src/` 和 `mock/`；不要为了通过 lint 关闭规则，先修复根因。

### Vue 与 Pinia

- Vue 组件只使用 Composition API 和 `<script setup lang="ts">`。
- 可复用组件使用 PascalCase 文件名；页面按目录组织并使用 `index.vue`。
- Pinia 只使用 setup store，并按领域拆分，不建立 god store。
- Pinia store 统一从 `src/stores/index.ts` 导出。

```ts
export const useFeatureStore = defineStore('feature', () => {
  const data = ref<Feature | null>(null)
  const loaded = computed(() => data.value !== null)

  function setData(value: Feature | null) {
    data.value = value
  }

  return { data, loaded, setData }
})
```

### 路由与权限

- `staticRoutes`：登录、错误页等无需认证页面。
- `basicRoutes`：登录后可访问的布局及 dashboard、profile 等页面。
- `asyncRoutes`：按 `meta.requiredPermissions` / `meta.requiredRoles` 过滤后动态注入。
- 路由守卫在 `src/router/guards.ts`；权限过滤和菜单生成在 `src/router/utils.ts` 与 `src/stores/permission.ts`。
- 路由权限检查复用统一逻辑，不要在页面中重复实现守卫判断。
- 按钮权限使用 `v-permission` 或 `usePermission()`，不要硬编码角色名判断权限。

```vue
<a-button v-permission="'system.user.create'">新增</a-button>
<a-button v-permission="['system.user.edit', 'system.user.delete']">操作</a-button>
<a-button v-permission.all="['system.user.edit', 'system.user.approve']">审批</a-button>
```

```ts
const { can, canAll, hasRole } = usePermission()
```

修改权限码、`asyncRoutes` 或角色权限后，要验证菜单显示、接口鉴权和无权限跳转；旧的动态路由和 Tabs 缓存可能影响结果，必要时退出后重新登录。

## 认证与请求错误处理

- 受保护请求使用 `src/utils/request.ts`，业务错误统一通过 `src/utils/apiError.ts` 解析和展示。
- `showApiError(error)` 按异常对象去重；页面接管错误展示时设置 `skipErrorMessage: true`，捕获后仍调用 `showApiError(error)`，不要重新包装后重复弹窗。
- 业务错误必须保留带原始响应的 `AxiosError`，不得丢失业务码、HTTP 状态或 `requestId`；下载接口的 JSON 错误可能以 Blob 返回，由请求层解析。
- 优先使用当前语言 `apiErrors.codes`；未知业务码使用后端中文 `message` 兜底。新增业务码时同步维护四种语言包。
- 成功提示和前端本地校验使用 `$t()` / `t()`，不写死中文，也不直接展示后端成功 `message`。
- HTTP 状态与业务码分开处理：真实后端成功码为 `0`，现有 Mock 也接受 `200`；真实后端未认证为 HTTP 401 / code `20001`，无权限为 HTTP 403 / code `20002`。旧 Mock 业务码 `401` 只是兼容路径，不作为新接口约定。
- 受保护请求认证失败时刷新，原请求最多重试一次；刷新遇到网络故障、超时或服务异常时保留登录态并传播错误。刷新明确未认证，或重试仍未认证时清理登录态，并遵守 `skipRedirect`。登录和刷新接口本身不得递归触发刷新。
- 修改请求错误处理或刷新策略后运行 `pnpm run test:unit:run`，重点检查 `tests/unit/request-service.spec.ts`；不要为满足旧断言而把所有刷新失败都改成退出登录。

```ts
import { getUserInfo } from '@/api/auth'
import { showApiError } from '@/utils/apiError'

try {
  await getUserInfo({ skipErrorMessage: true })
} catch (error) {
  showApiError(error)
}
```

## 样式与主题

- 主题颜色、间距和暗色模式优先使用 `src/assets/styles/variables.css` 中的 CSS Variables。
- Tailwind CSS 4 与主题变量桥接；非工具类样式优先使用 CSS Variables，避免硬编码主题颜色。
- SCSS 只用于局部样式和复杂选择器。
- 修改主题、布局或响应式行为后检查亮色、暗色和窄屏布局。

## 测试

- Vitest 使用 Node 环境、关闭 globals；测试文件必须显式导入 `describe`、`it`、`expect`。
- 测试文件位于 `tests/unit/**/*.spec.ts`。
- 请求刷新回归用例位于 `tests/unit/request-service.spec.ts`：刷新遇到网络故障、超时、503 或普通异常时保留登录态；刷新返回 HTTP 401（真实后端业务码 `20001`）或旧 Mock 业务码 `401` 时清理登录态并跳转登录。使用真实 `AxiosError` 构造异常，并验证原始错误继续向上传播。
- 不新增没有断言的测试，不为通过测试放宽安全行为。
- 当前未配置可运行的 E2E 测试；新增 E2E 依赖或脚本前先说明必要性。

## 常见陷阱

1. 忘记运行 `pnpm run test:unit:run`，或只跑构建而漏掉请求/权限回归。
2. 把示例页面或 `examples` 路由重新引入精简模板。
3. 在页面里重复实现路由权限判断，绕过守卫或统一权限工具。
4. 直接修改 `asyncRoutes` 后沿用旧登录态验证，导致缓存路由干扰结果。
5. 在非主题样式里写死颜色，破坏暗色模式和多主题。
6. 用 `any`、忽略注释或关闭 lint 规则掩盖真实问题。

## 提交与 PR

使用 Conventional Commits：`feat`、`fix`、`refactor`、`docs`、`style`、`test`、`chore`、`perf`。

```text
feat(auth): 增加会话恢复
fix(permission): 修正动态路由过滤
docs(agents): 精简模板开发约定
```

PR 前确认：

- [ ] 类型检查、lint、单元测试和构建通过
- [ ] 认证/RBAC 变更已验证登录、菜单和接口权限
- [ ] 新业务码已同步四种语言
- [ ] 未把示例页面或无关重构带回精简模板
- [ ] UI 变更附截图或 GIF
- [ ] 提交范围单一，消息符合 Conventional Commits
