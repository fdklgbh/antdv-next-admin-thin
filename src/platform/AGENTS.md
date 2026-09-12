# 桌面平台适配维护指南

本文件适用于 src/platform/；同时遵循 frontend/AGENTS.md。

## 调用边界

- runtime.ts 是手写前端唯一直接导入 Wails runtime 的位置。
- 窗口操作通过 @/platform/window，浏览器操作通过 @/platform/browser。
- 环境信息通过 @/platform/system；保留 v2 Environment 的 platform 字段。
- Go 业务服务通过 @/services/<领域>，不混入 runtime 入口，不手改生成绑定。
- 切换 Wails 版本时适配 runtime.ts、依赖和别名，保持组件使用的接口契约。

## 窗口行为

- WindowApi 的异步操作保留 Promise 和错误传播，不使用静默降级。
- v2 同步命令适配为 Promise；完成表示命令已发出，不代表原生动画结束。
- close 沿用 Quit，restore 使用 WindowUnmaximise，切换使用 WindowToggleMaximise。
- v2.15 runtime 未接管 DOM 双击，handlesDragDoubleClick 返回 false。
- 其他版本或平台应核对原生双击行为，避免一次双击重复切换。
- 不用页面 zoom 修正原生窗口恢复尺寸。

## 指令接入约定

- 全局 v-window-drag 由 src/directives/windowDrag.ts 实现，默认不传值。
- 指令响应 layoutStore.isMobile：移动端禁用；显式 false 可额外禁用。
- 显式 true 不覆盖移动端限制；卸载时停止监听并移除事件处理器。
- 优先用于原生元素；用于 Vue 组件时确认单个元素根节点及指令透传。
- 按钮、链接、输入及可编辑区域自动排除；自定义交互区域用 window-no-drag。

## 验证

- 修改接口或引用后运行 pnpm run type-check，按影响运行 lint 和构建。
- 桌面实测拖拽、双击最大化/还原、按钮图标同步、交互区域排除、响应式启停。
- 恢复相关改动检查最大化后最小化再从任务栏恢复；浏览器预览不能替代此验证。
