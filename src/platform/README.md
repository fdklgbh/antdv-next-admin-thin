# 桌面 runtime 入口

`runtime.ts` 是手写前端代码唯一直接导入 Wails runtime 的位置。
组件按领域从 `@/platform/window`、`@/platform/browser`、`@/platform/system`
导入；Go 服务仍从 `@/services/<领域>` 导入，不修改生成绑定。

## 拖拽和双击

全局指令已注册，Header 与偏好设置标题已接入：

```vue
<div v-window-drag>
  标题：拖动窗口，双击最大化或还原
  <button>自动排除的按钮</button>
  <div class="window-no-drag">自定义交互区域</div>
</div>
```

使用 `v-window-drag="enabled"` 动态启停。优先添加到原生 DOM 元素；用于 Vue
组件时要求单个元素根节点及指令透传。按钮、链接、输入框、role="button"、
可编辑区域自动排除。移动端的 Header 与偏好设置禁用此功能。

## 版本适配

当前实现使用 v2.15 runtime，同步命令适配为 Promise，保持与 v3 的窗口接口一致。
Promise 表示命令已发出，不代表原生窗口动画完成。窗口状态通过 isMaximized 查询。
v2 runtime 没有接管 DOM 双击，handlesDragDoubleClick 返回 false，由指令切换。
关闭操作沿用 Quit，浏览器链接使用 BrowserOpenURL，环境信息使用 Environment。

切换版本时集中修改 runtime.ts，并调整依赖和别名。v3 使用 Window.ToggleMaximise
等窗口接口，macOS 原生双击由 runtime 接管，应返回 true 防止重复切换。
环境接口也需适配字段：v2 使用 platform，v3 使用 OS。Go 服务绑定迁移另行处理。

桌面验收：拖拽、双击最大化/还原、按钮图标同步、交互控件排除、动态禁用、
最大化后最小化再从任务栏恢复。浏览器预览不能验证原生窗口行为。
