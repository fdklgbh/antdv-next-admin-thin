import type { ObjectDirective } from 'vue';

import { windowApi } from '@/platform/window';

function handleDoubleClick(event: MouseEvent) {
  if (event.button !== 0 || event.defaultPrevented || windowApi.handlesDragDoubleClick()) return;
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (getComputedStyle(target).getPropertyValue('--wails-draggable').trim() !== 'drag') return;

  // 防止嵌套区域重复切换。
  event.stopPropagation();
  event.preventDefault();
  void windowApi.toggleMaximize().catch((error: unknown) => {
    console.error('切换窗口最大化状态失败', error);
  });
}

export const vWindowDrag: ObjectDirective<HTMLElement, boolean | undefined> = {
  mounted(el, { value }) {
    el.classList.add('window-drag-region');
    el.classList.toggle('window-no-drag', value === false);
    el.addEventListener('dblclick', handleDoubleClick);
  },
  updated(el, { value }) {
    el.classList.toggle('window-no-drag', value === false);
  },
  beforeUnmount(el) {
    el.removeEventListener('dblclick', handleDoubleClick);
    el.classList.remove('window-drag-region', 'window-no-drag');
  },
};
