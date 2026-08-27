<template>
  <div class="window-controls" role="group" :aria-label="$t('layout.windowControls')">
    <a-tooltip :title="$t('layout.minimizeWindow')">
      <a-button
        type="text"
        class="window-control-btn"
        :aria-label="$t('layout.minimizeWindow')"
        @click="minimizeWindow"
      >
        <MinusOutlined />
      </a-button>
    </a-tooltip>

    <a-tooltip :title="isMaximized ? $t('layout.restoreWindow') : $t('layout.maximizeWindow')">
      <a-button
        type="text"
        class="window-control-btn"
        :aria-label="isMaximized ? $t('layout.restoreWindow') : $t('layout.maximizeWindow')"
        :aria-pressed="isMaximized"
        @click="toggleMaximize"
      >
        <IconView v-if="isMaximized" icon="mdi:window-restore" :size="14" />
        <BorderOutlined v-else />
      </a-button>
    </a-tooltip>

    <a-tooltip :title="$t('layout.closeWindow')">
      <a-button
        type="text"
        class="window-control-btn close-btn"
        :aria-label="$t('layout.closeWindow')"
        @click="closeWindow"
      >
        <CloseOutlined />
      </a-button>
    </a-tooltip>
  </div>
</template>

<script setup lang="ts">
import { BorderOutlined, CloseOutlined, MinusOutlined } from '@antdv-next/icons';
import { onBeforeUnmount, onMounted, ref } from 'vue';

import IconView from '@/components/Icon/index.vue';
import { $t } from '@/locales';
import { windowApi } from '@/platform/window';

const isMaximized = ref(false);

const syncMaximizedState = async () => {
  isMaximized.value = await windowApi.isMaximized();
};

const handleResize = () => {
  void syncMaximizedState();
};

const minimizeWindow = () => {
  void windowApi.minimize();
};

const toggleMaximize = async () => {
  if (isMaximized.value) {
    await windowApi.restore();
  } else {
    await windowApi.maximize();
  }

  await syncMaximizedState();
};

const closeWindow = () => {
  void windowApi.close();
};

onMounted(() => {
  void syncMaximizedState();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped lang="scss">
.window-controls {
  display: flex;
  align-items: center;
  margin-left: 4px;
  padding-left: 4px;
  border-left: 1px solid var(--color-border-secondary);
  --wails-draggable: no-drag;
}

.window-control-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0 !important;
  border-radius: var(--radius-base);
  color: var(--color-text-secondary);
  transition: all var(--duration-base) var(--ease-out);
  --wails-draggable: no-drag;

  &:hover {
    background: var(--color-bg-layout);
    color: var(--color-text-primary);
  }

  &.close-btn:hover {
    background: var(--color-error);
    color: #ffffff;
  }
}
</style>
