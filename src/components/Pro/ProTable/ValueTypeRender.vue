<template>
  <span class="value-type-render">
    <!-- Text -->
    <span v-if="type === 'text'" :class="{ copyable }" @click="handleCopy">
      {{ value }}
    </span>

    <!-- Date -->
    <span v-else-if="type === 'date'">
      {{ formatDate(value, resolvedValueTypeProps.format || "YYYY-MM-DD") }}
    </span>

    <!-- DateTime -->
    <span v-else-if="type === 'dateTime'">
      {{ formatDate(value, resolvedValueTypeProps.format || "YYYY-MM-DD HH:mm:ss") }}
    </span>

    <!-- Tag -->
    <a-tag v-else-if="type === 'tag'" :color="getEnumConfig(value)?.color">
      {{ getEnumConfig(value)?.text || value }}
    </a-tag>

    <!-- Badge -->
    <a-badge
      v-else-if="type === 'badge'"
      :status="getBadgeStatus(value)"
      :text="getEnumConfig(value)?.text || value"
    />

    <!-- Money -->
    <span v-else-if="type === 'money'" class="money">
      {{ resolvedValueTypeProps.symbol ?? "¥"
      }}{{ formatMoney(value, resolvedValueTypeProps.precision) }}
    </span>

    <!-- Percent -->
    <span v-else-if="type === 'percent'">
      {{ formatPercent(value, resolvedValueTypeProps.precision) }}%
    </span>

    <!-- Avatar -->
    <a-avatar
      v-else-if="type === 'avatar'"
      :src="asString(value)"
      :size="resolvedValueTypeProps.size || 32"
    />

    <!-- Image -->
    <a-image
      v-else-if="type === 'image'"
      :src="asString(value)"
      :width="resolvedValueTypeProps.width || 80"
    />

    <!-- Link -->
    <a v-else-if="type === 'link'" :href="asString(value)" target="_blank" class="link">
      {{ value }}
    </a>

    <!-- Progress -->
    <a-progress
      v-else-if="type === 'progress'"
      :percent="asNumber(value)"
      :status="(asNumber(value) ?? 0) >= 100 ? 'success' : 'active'"
      v-bind="resolvedValueTypeProps"
    />

    <!-- Default -->
    <span v-else>{{ value }}</span>
  </span>
</template>

<script setup lang="ts">
import type { ValueType } from "@/types/pro";

import { computed } from "vue";

import { message } from "antdv-next";
import dayjs from "dayjs";

import { $t } from "@/locales";
import { copyToClipboard } from "@/utils/helpers";

interface ValueTypeProps {
  format?: string;
  symbol?: string;
  precision?: number;
  size?: number;
  width?: number;
}

type BadgeStatus = "success" | "processing" | "default" | "error" | "warning";

interface Props {
  value: unknown;
  type?: ValueType;
  enum?: Record<string, { text: string; status?: string; color?: string }>;
  record?: Record<string, unknown>;
  copyable?: boolean;
  valueTypeProps?: ValueTypeProps;
}

const props = withDefaults(defineProps<Props>(), {
  type: "text",
  copyable: false,
  valueTypeProps: () => ({}),
});

const resolvedValueTypeProps = computed<ValueTypeProps>(() => props.valueTypeProps ?? {});

const asString = (val: unknown): string | undefined => {
  return typeof val === "string" ? val : undefined;
};

const asNumber = (val: unknown): number | undefined => {
  return typeof val === "number" ? val : undefined;
};

const getEnumKey = (value: unknown) => {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }
  return undefined;
};

const getEnumConfig = (value: unknown) => {
  const key = getEnumKey(value);
  return key ? props.enum?.[key] : undefined;
};

const getBadgeStatus = (value: unknown): BadgeStatus | undefined => {
  const status = getEnumConfig(value)?.status;
  if (
    status === "success" ||
    status === "processing" ||
    status === "default" ||
    status === "error" ||
    status === "warning"
  ) {
    return status;
  }
  return undefined;
};

const formatDate = (value: unknown, format: string) => {
  if (!value) return "-";
  if (typeof value === "string" || typeof value === "number" || value instanceof Date) {
    return dayjs(value).format(format);
  }
  return "-";
};

const formatMoney = (value: unknown, precision?: number) => {
  if (value === null || value === undefined) return "0.00";
  const p = precision ?? 2;
  return Number(value)
    .toFixed(p)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const formatPercent = (value: unknown, precision?: number) => {
  if (value === null || value === undefined) return "0";
  const p = precision ?? 2;
  return Number(value).toFixed(p);
};

const handleCopy = async () => {
  if (props.copyable && props.value) {
    const success = await copyToClipboard(String(props.value));
    if (success) {
      message.success($t("common.copySuccess"));
    } else {
      message.error($t("common.copyFailed"));
    }
  }
};
</script>

<style scoped lang="scss">
.value-type-render {
  .copyable {
    cursor: pointer;
    &:hover {
      color: var(--color-primary);
    }
  }

  .money {
    font-weight: var(--font-weight-medium);
    color: var(--color-error);
  }

  .link {
    color: var(--color-primary);
    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
