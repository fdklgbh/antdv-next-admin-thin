# Antdv Next Admin - Agent Guidelines

A Vue 3 + TypeScript + Ant Design Vue admin scaffold with RBAC, theming, i18n (zh-CN/en-US/ja-JP/ko-KR), Tailwind CSS 4, Codemirror 6, and mock APIs.

## Project Structure

```
src/
├── api/              # API layer - organized by domain (auth.ts, user.ts)
├── assets/styles/    # Global styles (variables.css, animations.css, global.css)
├── components/       # Reusable components (Layout/, Permission/, etc.)
├── composables/      # Composition functions (usePermission.ts, useWatermark.ts)
├── directives/       # Custom Vue directives (permission.ts)
├── locales/          # i18n translations (zh-CN.ts, en-US.ts)
├── router/           # Vue Router (routes.ts, guards.ts, utils.ts)
├── stores/           # Pinia stores - one per domain (auth.ts, theme.ts, layout.ts)
├── types/            # TypeScript interfaces/types (auth.ts, api.ts, router.ts)
├── utils/            # Pure utility functions (request.ts, storage.ts, helpers.ts)
└── views/            # Page components (dashboard/, system/, examples/)

mock/
├── data/             # Mock datasets (users.data.ts, roles.data.ts)
└── handlers/         # Mock API handlers (auth.mock.ts, user.mock.ts)

tests/
├── e2e/              # End-to-end tests (*.spec.ts) - templates for future Playwright setup
└── unit/             # Runnable Vitest unit tests (*.spec.ts)
```

## Build, Test, and Development Commands

### Essential Commands
```bash
pnpm install              # Install all dependencies
pnpm run dev              # Start dev server at http://localhost:3000 (with mock APIs)
pnpm run build            # Production build → dist/
pnpm run build:check      # vue-tsc type check + production build
pnpm run build:demo       # Demo build for static hosting (browser-side mock)
pnpm run preview          # Preview production build locally
pnpm run type-check       # Run vue-tsc --noEmit (NO auto-fix)

# Testing (Vitest)
pnpm run test:unit        # Run unit tests in watch mode
pnpm run test:unit:run    # Run unit tests once

# Linting & Formatting
pnpm run lint             # Lint with oxlint
pnpm run lint:fix         # Auto-fix lint issues
pnpm run format           # Format with oxfmt
pnpm run format:check     # Check formatting
```

### Pre-commit Requirements
**BEFORE any commit or PR:**
1. Run `pnpm run type-check` - must exit 0 with no errors
2. Run `pnpm run lint` - must exit 0 with no errors
3. Run `pnpm run build` - must complete successfully
4. For RBAC/auth changes: manually verify login with `admin/123456` and `user/123456`

### Testing
- **Vitest** is configured (`vitest.config.ts`): `environment: 'node'`, `globals: false`
- Test files: `tests/unit/**/*.spec.ts` — must import `describe`/`it`/`expect` from vitest
- 请求层回归用例位于 `tests/unit/request-service.spec.ts`：刷新遇到网络故障、超时、503 或普通异常时保留登录态；刷新返回 HTTP 401（真实后端业务码 `20001`）或现有 Mock 的业务码 `401` 时清理登录态并跳转登录。使用真实 `AxiosError` 构造异常，并验证原始错误继续向上传播。
- 修改请求错误处理或刷新策略后运行 `pnpm run test:unit:run`，不要为满足旧断言而将所有刷新失败都改为退出登录。
- **Playwright** e2e templates exist in `tests/e2e/` but Playwright is not yet installed

## Code Style Guidelines

### Formatting (EditorConfig)
- **Indentation**: 2 spaces (NO tabs)
- **Line endings**: LF (Unix-style)
- **Encoding**: UTF-8
- **Final newline**: required
- **Trailing whitespace**: trimmed (except in .md files)

### TypeScript
- **Strict mode enabled** (`tsconfig.json`): all strict checks ON
- **Path aliases**: use `@/` for `src/` (e.g., `import { useAuthStore } from '@/stores/auth'`)
- **Type annotations**: explicit return types for public functions/composables
- **Type definitions**: place shared types in `src/types/`, domain-specific types near usage
- **No type suppression**: NEVER use `as any`, `@ts-ignore`, or `@ts-expect-error`

### Vue Component Style
**Component naming:**
- **Files**: PascalCase for reusable components (`NotificationPanel.vue`, `ThemeToggle.vue`)
- **Views**: route-based folders with `index.vue` (`src/views/dashboard/index.vue`)

**Component structure (Composition API only):**
```vue
<template>
  <!-- Template using script setup's reactive state -->
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { User } from '@/types/auth'

// Props
interface Props {
  userId: string
  mode?: 'edit' | 'view'
}
const props = withDefaults(defineProps<Props>(), {
  mode: 'view'
})

// Emits
const emit = defineEmits<{
  save: [user: User]
  cancel: []
}>()

// State
const authStore = useAuthStore()
const loading = ref(false)
const user = computed(() => authStore.user)

// Methods (prefer explicit function declarations)
function handleSave() {
  // Implementation
}
</script>

<style scoped>
/* Component-specific styles */
</style>
```

### Import Ordering
Group imports in this order (blank line between groups):
```ts
// 1. Vue core
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// 2. Third-party libraries
import { message } from 'antdv-next'
import dayjs from 'dayjs'

// 3. Project imports (@/ alias)
import { useAuthStore } from '@/stores/auth'
import { login, getUserInfo } from '@/api/auth'
import type { User, LoginParams } from '@/types/auth'
```

### Naming Conventions
| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `NotificationPanel.vue`, `TabBar.vue` |
| Composables | `useXxx.ts` | `usePermission.ts`, `useFullscreen.ts` |
| Stores | Domain-based | `auth.ts`, `permission.ts`, `theme.ts` |
| Types/Interfaces | PascalCase | `User`, `LoginParams`, `ApiResponse<T>` |
| Functions | camelCase | `getUserInfo()`, `checkPermission()` |
| Constants | SCREAMING_SNAKE_CASE | `TOKEN_KEY`, `API_BASE_URL` |

### Error Handling
- 接口错误统一通过 `src/utils/apiError.ts` 处理。`resolveApiError()` 解析文案，`showApiError()` 展示提示并按异常对象去重；不要重新包装异常后再次弹窗。
- 优先使用当前语言的 `apiErrors.codes` 文案；未知业务码使用后端中文 `message` 兜底；缺少文案时使用 HTTP 状态、网络异常或通用失败提示。新增业务码时同步维护 `zh-CN`、`en-US`、`ja-JP`、`ko-KR` 四种语言包。
- `src/utils/request.ts` 默认负责弹窗；页面需要接管时设置 `skipErrorMessage: true`，捕获后仍使用 `showApiError(error)`。成功提示及前端本地校验使用 `$t()` / `t()`，不直接展示后端成功 `message`，不写死中文。
- 业务错误保留为携带原始响应的 `AxiosError`，不得丢失业务码、HTTP 状态或 `requestId`。下载接口的 JSON 错误可能以 Blob 返回，由请求层解析。
- HTTP `status` 与业务 `code` 分开处理：真实后端成功码为 `0`，现有 Mock 也接受 `200`；真实后端未认证为 HTTP 401 / code `20001`，无权限为 HTTP 403 / code `20002`。旧 Mock 业务码 `401` 的处理属于已有兼容路径，不作为新增后端接口约定。
- 受保护请求认证失败时刷新，原请求最多重试一次；刷新遇到网络故障、超时或服务异常时保留登录态并传播错误。刷新明确未认证，或重试仍返回未认证时，清理登录态；遵守 `skipRedirect`。登录和刷新接口本身不得递归触发刷新。

```ts
import { getUserInfo } from '@/api/auth'
import { showApiError } from '@/utils/apiError'

try {
  const response = await getUserInfo({ skipErrorMessage: true })
  // Success path
} catch (error) {
  showApiError(error)
}
```

### State Management (Pinia)
- **Setup stores only** (NOT options API)
- **One store per domain** - no god-objects
- **Store structure pattern:**
```ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // State (ref)
  const token = ref<string | null>(null)
  
  // Getters (computed)
  const isLoggedIn = computed(() => !!token.value)
  
  // Actions (functions)
  const setToken = (newToken: string | null) => {
    token.value = newToken
  }
  
  return { token, isLoggedIn, setToken }
})
```

### Permission System Usage
**Directive (in templates):**
```vue
<!-- Single permission (OR logic by default) -->
<a-button v-permission="'user.create'">Create</a-button>

<!-- Multiple permissions (OR logic) -->
<a-button v-permission="['user.edit', 'user.delete']">Actions</a-button>

<!-- ALL permissions required (AND logic) -->
<a-button v-permission.all="['user.edit', 'user.approve']">Approve</a-button>
```

**Composable (in script):**
```ts
const { can, canAll, hasRole } = usePermission()

if (can('user.create')) {
  // User has permission
}

if (canAll(['user.edit', 'user.approve'])) {
  // User has ALL permissions
}
```

## Configuration & Environment

### Environment Variables
- **Development** (`.env.development`): `VITE_USE_MOCK=true`, `VITE_API_BASE_URL=/api`
- **Production** (`.env.production`): `VITE_USE_MOCK=false`, set real API URL
- **Never commit secrets** - use `.env.local` for sensitive values (gitignored)

### Mock API System
- **Auto-enabled in dev** via `vite-plugin-mock-dev-server`
- **Handlers**: `mock/handlers/*.mock.ts` define endpoints
- **Data**: `mock/data/*.data.ts` contain sample datasets
- **Prefix**: all mock APIs use `/api` prefix (e.g., `/api/auth/login`)

## Common Pitfalls to Avoid

1. **Oxlint** lints `src/` and `mock/` — run `pnpm run lint` before committing. Oxfmt handles import sorting automatically.
2. **Don't suppress TypeScript errors** - fix the root cause instead
3. **Tests**: Vitest unit tests are runnable with `pnpm run test:unit:run`; only the Playwright e2e files remain templates without installed Playwright dependencies.
4. **Mock users**: `admin/123456` has full permissions, `user/123456` has limited permissions
5. **Dynamic routes**: permissions control route visibility via `src/router/guards.ts`
6. **KeepAlive caching**: managed by `tabs` store - check cached component names

## Commit Guidelines

**Use Conventional Commits:**
```
type(scope): summary

Examples:
feat(auth): add biometric login support
fix(permission): correct role-based route filtering
refactor(layout): extract sidebar menu logic to composable
docs(readme): update installation instructions
```

**Commit types:** `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`, `perf`

## Pull Request Checklist

- [ ] `pnpm run type-check` passes
- [ ] `pnpm run build` succeeds
- [ ] Manually tested login flow (if auth-related)
- [ ] Manually verified permissions (if RBAC-related)
- [ ] Screenshots/GIFs included (for UI changes)
- [ ] Commit messages follow Conventional Commits
- [ ] Changes are scoped (no unrelated refactors mixed in)
