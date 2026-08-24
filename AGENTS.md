# Antdv Next Admin - Agent 指南

## 项目概览

Antdv Next Admin 是一个 Vue 3.5、TypeScript 6、Vite 8 管理后台脚手架，使用
Antdv Next、Pinia、Vue Router、vue-i18n、Tailwind CSS 4、SCSS、Pro 组件、
TipTap、Milkdown、CodeMirror、ECharts 和 Mock API。

当前应用是无认证脚手架。项目目前没有登录路由、角色或权限路由、认证 API、
Token 持久化，也不会注入 Authorization 请求头。src/stores/auth.ts 仅提供默认
的本地用户资料。

项目命令使用 pnpm。仓库包含 pnpm-lock.yaml 和 pnpm-workspace.yaml，请避免
无必要地修改额外存在的 npm 锁文件。

## 项目结构

~~~text
src/
  api/                  API 请求封装：config、dict、file、log、user
  assets/styles/        CSS 变量、全局样式、动画、Tailwind 入口
  components/Layout/    主布局、侧边栏、顶部栏、标签页、搜索、设置
  components/Pro/       ProTable、ProForm、ProModal 等 Pro 组件
  components/Captcha/   滑块、旋转、拼图、点选验证码
  components/           编辑器、Milkdown、Icon、JSON、国际化输入等通用组件
  composables/          可复用的组合式函数
  locales/              zh-CN、en-US、ja-JP、ko-KR 翻译资源
  mock/                 Demo 模式的浏览器端 Mock 初始化
  router/               路由定义、导航守卫、Router 初始化
  stores/               按领域拆分的 Pinia setup store
  types/                API、路由、布局、用户、Pro 组件共享类型
  utils/                请求、存储、i18n、图标、菜单、表单、导出等工具
  views/                Dashboard、系统页面、个人资料、通知、关于、异常页
mock/
  data/                 共享 Mock 数据集
  handlers/             /api 前缀下的 Vite Mock 服务处理器
tests/unit/             Vitest 单元测试，配置范围为 tests/unit/**/*.spec.ts
docs/images/            文档截图
~~~

重要运行文件：

- src/main.ts 负责初始化 Pinia、Router、i18n、全局样式、组件默认属性，并在
  Demo 模式下启用浏览器端 Mock。
- src/router/routes.ts 定义 staticRoutes、basicRoutes 和兜底路由。当前路由是
  静态路由，不使用 RBAC。
- src/router/guards.ts 负责页面标题、字典加载、标签页初始化、活动标签页和
 菜单历史记录，不负责用户认证。
- src/utils/request.ts 提供 Axios 实例和带类型的请求方法。
- src/components/Global/defaultComponentProps.ts 保存全局 Antdv Next 组件默认属性。
  修改表单或按钮行为前应先检查该文件。

## 常用命令

~~~bash
pnpm install
pnpm run dev              # 启动 Vite 开发服务：http://localhost:3000
pnpm run build            # 生产构建，输出到 dist/
pnpm run build:check      # vue-tsc 类型检查加生产构建
pnpm run build:demo       # 启用浏览器端 Mock 的静态 Demo 构建
pnpm run build:demo:check # 类型检查加静态 Demo 构建
pnpm run preview          # 预览生产构建
pnpm run type-check       # vue-tsc --noEmit

pnpm run test:unit        # Vitest 监听模式
pnpm run test:unit:run    # Vitest 单次运行

pnpm run lint             # oxlint src mock
pnpm run lint:fix         # oxlint --fix src mock
pnpm run format           # oxfmt --write src mock
pnpm run format:check     # oxfmt --check src mock
~~~

提交或创建 Pull Request 前运行：

~~~bash
pnpm run lint
pnpm run format:check
pnpm run type-check
pnpm run test:unit:run
pnpm run build:check
~~~

## 环境与 Mock API

- .env 设置 VITE_APP_TITLE 和默认的 VITE_API_BASE_URL（/api）。
- .env.development 设置开发环境的 Mock 相关变量。
- .env.demo 设置静态托管使用的 VITE_DEMO_MODE=true。
- .env.production 关闭文档中约定的 Mock 配置，并包含一个占位后端地址。真实
  部署前必须替换该地址。

vite.config.ts 中配置了带 /api 前缀的 Vite Mock 插件，并从 mock/handlers
加载处理器。Demo 模式下，src/main.ts 会调用 src/mock/browser.ts 中的
setupBrowserMock，该实现使用 axios-mock-adapter。

VITE_DEMO_MODE 是浏览器端 Mock 的运行时开关，VITE_USE_MOCK 目前只是环境变量
约定和类型声明，未在源码中作为条件进行判断。

Mock 数据覆盖用户、字典、配置、文件、操作日志和 Dashboard。新增 API 通常需要
同步更新以下文件：

~~~text
src/types/[entity].ts
src/api/[entity].ts
mock/data/[entity].data.ts
mock/handlers/[entity].mock.ts
~~~

如果功能必须支持静态 Demo，还需要同步更新 src/mock/browser.ts。
Mock 响应通常使用 { code: 200, message, success: true, data } 结构。
request 方法返回 response.data；非 200 响应会被拒绝，并在未设置
skipErrorMessage 时显示错误提示。

## TypeScript 与格式规范

- 使用 2 个空格、LF 换行、UTF-8 编码、文件末尾换行，并删除行尾空白。
  Markdown 文件可以按照 .editorconfig 保留行尾空白。
- .oxfmtrc.json 是源码格式的最终依据：每行最多 100 列、单引号、分号、尾随逗号
  和自动排序 import。
- TypeScript 开启 strict、noUnusedLocals、noUnusedParameters 和
  noFallthroughCasesInSwitch。应修复根因，不要使用 any、@ts-ignore 或
  @ts-expect-error 压制错误。
- src/ 使用 @/ 路径别名。import 顺序遵循 oxfmt 分组：类型 import、内置或第三方
  import、内部别名 import、相对路径 import。
- 共享类型放在 src/types/，功能专用类型放在对应功能附近。

## Vue、状态与界面约定

- 使用 Composition API 和 <script setup lang="ts">。
- 可复用组件文件使用 PascalCase。路由页面通常使用目录加 index.vue 入口文件。
- Pinia 使用 setup store，并按领域组织状态和操作，避免增加跨领域的巨型 store。
- Antdv Next 组件通过 unplugin-vue-components 和 AntdvNextResolver 自动导入。
  Select、DatePicker 和 DateRangePicker 被排除在自动解析之外，使用这些组件时
  先检查现有的显式 import。
- 主题相关样式使用 src/assets/styles/variables.css 中的 CSS 变量。局部布局和
  组件样式可以使用 Tailwind 或 SCSS。
- 路由元信息、语言 key 和菜单行为必须与四种语言资源及路由定义保持一致。新增
  用户可见文本时，应同步补充所有支持的语言。

## 持久化与导航

主题、布局、水印、标签页、菜单偏好和历史记录、语言以及 Demo 状态使用浏览器
存储。调试外观、标签页或菜单异常时，先清理相关 localStorage，再判断是否需要
修改业务逻辑。Router 还会从 sessionStorage 恢复 GitHub Pages 重定向地址。

## 测试

Vitest 配置在 vitest.config.ts 中，使用 node 环境，关闭全局 API，并且只包含
tests/unit/**/*.spec.ts。现有测试覆盖 auth store 默认值、请求服务、浏览器 Mock、
路由定义、菜单行为、Pro 组件、主题设置及相关工具。测试中应从 vitest 显式导入
describe、it、expect 和 vi。

当前没有受 Git 跟踪的 tests/e2e 测试目录，也没有 Playwright 依赖。除非实际加入
这些功能，否则不要描述或依赖登录凭据、RBAC 检查或 E2E 命令。

## 修改边界

- 编辑前先阅读相关源码、类型和测试文件，优先沿用已有实现模式，再考虑新增工具
  或抽象。
- 除非任务明确要求，否则不要新增测试文件。
- 不要修改仓库以外的文件；除非明确要求，不要默认提交，也不要执行 Git 远程操作。
- 保留与当前任务无关的工作区改动，避免大范围重构或无必要的锁文件变更。
- 敏感信息放在本地环境文件中，不要提交凭据或生产密钥。

## 提交约定

只有在明确要求提交时才创建提交，并使用 Conventional Commits：

~~~text
feat(scope): add a feature
fix(scope): correct behavior
refactor(scope): simplify implementation
docs(scope): update documentation
test(scope): update tests
chore(scope): update tooling
~~~

提交应只包含当前任务相关改动，并在提交前通过上面的验证命令。
