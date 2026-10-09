<template>
  <JsonInput
    v-model:value="innerValue"
    :display-key="displayLocale"
    :label-map="localeLabelMap"
    :placeholder="placeholder"
    :modal-title="modalTitle"
    :allow-add="false"
    :allow-delete="false"
    :allow-sort="false"
    :allow-edit-key="false"
    :allow-edit-type="false"
    :allow-raw-edit="false"
  />
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';

import JsonInput from '@/components/JsonInput/index.vue';
import { getLocale, SUPPORTED_LOCALES } from '@/locales';

const props = defineProps({
  value: {
    type: [String, Object] as PropType<string | Record<string, string>>,
    default: () => ({}),
  },
  locale: {
    type: String,
    default: () => getLocale(),
  },
  placeholder: {
    type: String,
    default: '',
  },
  modalTitle: {
    type: String,
    default: '',
  },
  strictLocales: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:value', 'change']);

interface LocaleMeta {
  display: string;
  flag: string;
}

const localeMetaMap: Record<string, LocaleMeta> = {
  'zh-CN': { display: '简体中文', flag: '🇨🇳' },
  'en-US': { display: 'English', flag: '🇺🇸' },
  'ja-JP': { display: '日本語', flag: '🇯🇵' },
  'ko-KR': { display: '한국어', flag: '🇰🇷' },
};

const availableLocales = computed(() =>
  SUPPORTED_LOCALES.map((locale) => {
    const meta = localeMetaMap[locale];
    return {
      locale,
      display: meta?.display || locale,
      flag: meta?.flag || '🌐',
    };
  }),
);

const availableLocaleSet = computed(
  () => new Set(availableLocales.value.map((item) => item.locale)),
);

const displayLocale = computed(() => {
  const locale = props.locale || getLocale();
  if (availableLocaleSet.value.has(locale)) {
    return locale;
  }
  return availableLocales.value[0]?.locale || locale;
});

// Generate label map for locales
const localeLabelMap = computed(() => {
  const map: Record<string, string> = {};
  availableLocales.value.forEach((item) => {
    map[item.locale] = `${item.flag} ${item.display}`;
  });
  return map;
});

const innerValue = computed<Record<string, string>>({
  get: () => normalizeValue(props.value),
  set: (value) => {
    const nextValue =
      typeof props.value === 'string' ? JSON.stringify(value) : value;
    emit('update:value', nextValue);
    emit('change', nextValue);
  },
});

// Initialize default value with all locales
function getDefaultValue(): Record<string, string> {
  const defaultValue: Record<string, string> = {};
  availableLocales.value.forEach((item) => {
    defaultValue[item.locale] = '';
  });
  return defaultValue;
}

// Parse and normalize value
function normalizeValue(
  value: string | Record<string, string> | null | undefined,
): Record<string, string> {
  let parsed: Record<string, string> = {};

  if (!value) {
    parsed = getDefaultValue();
  } else if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        parsed = getDefaultValue();
      }
    } catch {
      parsed = getDefaultValue();
    }
  } else if (typeof value === 'object') {
    parsed = { ...value };
  }

  // Fill missing locales with empty string
  availableLocales.value.forEach((item) => {
    if (!parsed[item.locale]) {
      parsed[item.locale] = '';
    }
  });

  // Remove locales not in available list when strict mode is enabled
  if (props.strictLocales) {
    Object.keys(parsed).forEach((key) => {
      if (!availableLocaleSet.value.has(key)) {
        delete parsed[key];
      }
    });
  }

  return parsed;
}

</script>
