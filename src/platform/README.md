# 桌面 runtime 入口

`runtime.ts` 是手写前端代码唯一直接导入 Wails runtime 的位置。
组件按领域从 `@/platform/window`、`@/platform/browser` 导入，Go 服务仍从
`@/services/<领域>` 导入。生成绑定由 Wails 管理，不手工修改。

## 拖拽和双击

全局指令已在 `main.ts` 注册，不需要在组件中导入：

```vue
<div v-window-drag>
  标题：拖动窗口，双击最大化或还原
  <button>自动排除的按钮</button>
  <div class="window-no-drag">自定义交互区域</div>
</div>
```

使用 `v-window-drag="enabled"` 动态启停。优先添加在原生 DOM 元素上；
用于 Vue 组件时，组件必须具有单个元素根节点并支持指令透传。
按钮、链接、表单输入、role="button" 和可编辑区域自动排除。
macOS 使用 Wails 的原生标题栏双击行为，遵循系统偏好。

## 切换到 Wails v2

保持领域入口及 `WindowApi` 契约，只替换 `runtime.ts` 中的实现：

| 当前操作           | v2 runtime 方法                    |
| ------------------ | ---------------------------------- |
| minimize           | WindowMinimise                     |
| maximize           | WindowMaximise                     |
| restore            | WindowUnmaximise                   |
| toggleMaximize     | WindowToggleMaximise               |
| close              | Quit（沿用现有 v2 项目的退出语义） |
| isMaximized        | WindowIsMaximised                  |
| browserApi.openURL | BrowserOpenURL                     |

v2 的同步方法用 `async` 适配为 Promise，保证组件调用契约不变。
`handlesDragDoubleClick` 按所用 v2 runtime 的实际行为设置：原生已经处理双击的
平台返回 true，避免一次双击重复切换。不要直接照搬 v3 的平台判断。
同时调整项目 runtime 依赖和别名；这里的适配不替代 Go 服务绑定迁移。

验收应在桌面程序检查：拖拽、双击最大化/还原、窗口按钮图标同步、交互区域排除、
动态禁用，以及最大化后最小化再从任务栏恢复。浏览器预览不能验证原生窗口行为。
