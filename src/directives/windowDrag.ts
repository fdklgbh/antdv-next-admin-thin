import type { ObjectDirective } from 'vue';

import { ref, watchEffect } from 'vue';

import { windowApi } from '@/platform/window';
import { useLayoutStore } from '@/stores/layout';

const bindings = new WeakMap<
  HTMLElement,
  { update(value: boolean | undefined): void; stop(): void }
>();

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
    const layoutStore = useLayoutStore();
    const enabled = ref(value !== false);
    el.classList.add('window-drag-region');
    const stop = watchEffect(
      () => {
        el.classList.toggle('window-no-drag', layoutStore.isMobile || !enabled.value);
      },
      { flush: 'sync' },
    );
    bindings.set(el, {
      update: (nextValue) => {
        enabled.value = nextValue !== false;
      },
      stop,
    });
    el.addEventListener('dblclick', handleDoubleClick);
  },
  updated(el, { value }) {
    bindings.get(el)?.update(value);
  },
  beforeUnmount(el) {
    bindings.get(el)?.stop();
    bindings.delete(el);
    el.removeEventListener('dblclick', handleDoubleClick);
    el.classList.remove('window-drag-region', 'window-no-drag');
  },
};
