<template>
  <div class="cache-panel">
    <div class="panel-title">{{ $t('examples.scaffold.stateCache.panelBDesc') }}</div>
    <a-switch v-model:checked="checked" checked-children="ON" un-checked-children="OFF" />
    <a-textarea
      v-model:value="text"
      :rows="3"
      :placeholder="$t('examples.scaffold.stateCache.panelBTextPlaceholder')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { $t } from '@/locales';

defineOptions({
  name: 'DemoCachePanelB',
});

const checked = ref(false);
const text = ref('');
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
