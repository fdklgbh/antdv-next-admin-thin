<template>
  <div class="cache-panel">
    <div class="panel-title">{{ $t('examples.scaffold.stateCache.panelADesc') }}</div>
    <a-input
      v-model:value="localValue"
      :placeholder="$t('examples.scaffold.stateCache.panelAInputPlaceholder')"
    />
    <a-space>
      <a-button size="small" @click="localCount--">-</a-button>
      <span>{{ $t('examples.scaffold.stateCache.localCountLabel') }}{{ localCount }}</span>
      <a-button size="small" @click="localCount++">+</a-button>
    </a-space>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { $t } from '@/locales';

defineOptions({
  name: 'DemoCachePanelA',
});

const localValue = ref('');
const localCount = ref(0);
</script>

<style scoped lang="scss">
.cache-panel {
  border: 1px solid var(--color-border-secondary);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-title {
  font-weight: var(--font-weight-medium);
}
</style>
