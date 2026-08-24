<template>
  <a-result
    status="404"
    :title="$t('exception.404title')"
    :sub-title="$t('exception.404description')"
  >
    <template #extra>
      <a-button type="primary" @click="router.push('/')">
        {{ $t('error.backHome') }}
      </a-button>
    </template>
  </a-result>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();
</script>
