<template>
  <section class="icon-catalog" :aria-busy="loading">
    <header class="catalog-header">
      <div class="catalog-heading">
        <div class="catalog-kicker">
          <AppstoreOutlined />
          <span>{{ $t('iconLibrary.kicker') }}</span>
        </div>

        <div class="catalog-heading-row">
          <div>
            <h1>{{ $t('iconLibrary.title') }}</h1>
            <p>{{ $t('iconLibrary.description') }}</p>
          </div>

          <div class="catalog-summary" :aria-label="$t('iconLibrary.totalLabel')">
            <strong>{{ formatCount(totalIcons) }}</strong>
            <span>{{ $t('iconLibrary.totalUnit') }}</span>
          </div>
        </div>
      </div>

      <div class="catalog-toolbar">
        <div class="category-scroll">
          <div class="category-tabs" role="group" :aria-label="$t('iconLibrary.categoryLabel')">
            <button
              v-for="category in categoryOptions"
              :key="category.key"
              type="button"
              class="category-tab"
              :class="{ active: selectedCategory === category.key }"
              :aria-pressed="selectedCategory === category.key"
              @click="selectCategory(category.key)"
            >
              <span class="category-dot" :style="{ backgroundColor: category.color }" />
              <span>{{ category.label }}</span>
              <span class="category-count">{{ formatCount(category.count) }}</span>
            </button>
          </div>
        </div>

        <a-input
          v-model:value="keyword"
          allow-clear
          class="catalog-search"
          :placeholder="$t('iconLibrary.searchPlaceholder')"
          :aria-label="$t('iconLibrary.searchLabel')"
          autocomplete="off"
          spellcheck="false"
        >
          <template #prefix>
            <SearchOutlined />
          </template>
        </a-input>
      </div>
    </header>

    <section class="catalog-results" :aria-label="$t('iconLibrary.resultsLabel')">
      <div v-if="loading" class="catalog-state catalog-loading" role="status">
        <div class="loading-grid" aria-hidden="true">
          <div v-for="index in 24" :key="index" class="loading-tile">
            <span class="loading-icon" />
            <span class="loading-line loading-line-wide" />
            <span class="loading-line" />
          </div>
        </div>
        <p>{{ $t('iconLibrary.loading') }}</p>
      </div>

      <div v-else-if="errorMessage" class="catalog-state" role="alert">
        <ExclamationCircleOutlined class="state-icon state-icon-error" />
        <h2>{{ $t('iconLibrary.loadFailedTitle') }}</h2>
        <p>{{ errorMessage }}</p>
      </div>

      <div v-else-if="filteredIcons.length === 0" class="catalog-state" role="status">
        <InboxOutlined class="state-icon" />
        <h2>{{ $t('iconLibrary.emptyTitle') }}</h2>
        <p>{{ $t('iconLibrary.emptyDescription') }}</p>
      </div>

      <template v-else>
        <div class="icon-grid">
          <a-tooltip
            v-for="icon in pageItems"
            :key="icon.name"
            :title="$t('iconLibrary.copyTooltip', { name: icon.name })"
            placement="top"
          >
            <button
              type="button"
              class="icon-tile"
              :aria-label="$t('iconLibrary.copyAriaLabel', { name: icon.name })"
              @click="copyIconName(icon.name)"
            >
              <span class="icon-tile-preview">
                <IconView :icon="icon.name" :size="30" />
              </span>
              <span class="icon-tile-name" :title="icon.name">{{ icon.name }}</span>
              <span class="icon-tile-library">{{ getLibraryLabel(icon.library) }}</span>
              <span class="icon-tile-copy" aria-hidden="true">
                <CopyOutlined />
              </span>
            </button>
          </a-tooltip>
        </div>

        <footer class="catalog-footer">
          <span>
            {{
              $t('iconLibrary.resultSummary', {
                start: firstVisibleIndex,
                end: lastVisibleIndex,
                total: filteredIcons.length,
              })
            }}
          </span>
          <a-pagination
            v-if="filteredIcons.length > pageSize"
            v-model:current="currentPage"
            :page-size="pageSize"
            :total="filteredIcons.length"
            size="small"
            show-less-items
            :show-size-changer="false"
            :item-render="paginationItemRender"
            class="catalog-pagination"
          />
        </footer>
      </template>
    </section>
  </section>
</template>

<script setup lang="ts">
import type { PaginationProps } from 'antdv-next';

import {
  AppstoreOutlined,
  CopyOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
  SearchOutlined,
} from '@antdv-next/icons';
import { message } from 'antdv-next';
import { computed, h, onMounted, ref, watch } from 'vue';

import IconView from '@/components/Icon/index.vue';
import { $t } from '@/locales';
import {
  loadSupportedIconCatalog,
  type IconCatalogItem,
  type SupportedIconLibrary,
} from '@/utils/iconCatalog';

type CategoryKey = 'all' | SupportedIconLibrary;

interface CategoryDefinition {
  key: CategoryKey;
  labelKey: string;
  color: string;
}

const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  { key: 'all', labelKey: 'iconLibrary.categories.all', color: '#64748b' },
  { key: 'ri', labelKey: 'iconLibrary.categories.ri', color: '#3b82f6' },
  { key: 'mdi', labelKey: 'iconLibrary.categories.mdi', color: '#10b981' },
  { key: 'ion', labelKey: 'iconLibrary.categories.ion', color: '#8b5cf6' },
  { key: 'antdv-next', labelKey: 'iconLibrary.categories.antdv', color: '#ef4444' },
];

const pageSize = 72;
const icons = ref<IconCatalogItem[]>([]);
const selectedCategory = ref<CategoryKey>('all');
const keyword = ref('');
const currentPage = ref(1);
const loading = ref(true);
const errorMessage = ref('');

const libraryCounts = computed<Record<SupportedIconLibrary, number>>(() => {
  const counts: Record<SupportedIconLibrary, number> = {
    ri: 0,
    mdi: 0,
    ion: 0,
    'antdv-next': 0,
  };

  icons.value.forEach((icon) => {
    counts[icon.library] += 1;
  });

  return counts;
});

const categoryOptions = computed(() =>
  CATEGORY_DEFINITIONS.map((category) => ({
    ...category,
    label: $t(category.labelKey),
    count: category.key === 'all' ? icons.value.length : libraryCounts.value[category.key],
  })),
);

const totalIcons = computed(() => icons.value.length);

const filteredIcons = computed(() => {
  const normalizedKeyword = keyword.value.trim().toLowerCase();

  return icons.value.filter((icon) => {
    const matchesCategory =
      selectedCategory.value === 'all' || icon.library === selectedCategory.value;
    const matchesKeyword =
      !normalizedKeyword || icon.name.toLowerCase().includes(normalizedKeyword);

    return matchesCategory && matchesKeyword;
  });
});

const pageItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredIcons.value.slice(start, start + pageSize);
});

const firstVisibleIndex = computed(() =>
  filteredIcons.value.length === 0 ? 0 : (currentPage.value - 1) * pageSize + 1,
);
const lastVisibleIndex = computed(() =>
  Math.min(currentPage.value * pageSize, filteredIcons.value.length),
);

const libraryLabels = computed<Record<SupportedIconLibrary, string>>(() => ({
  ri: $t('iconLibrary.categories.ri'),
  mdi: $t('iconLibrary.categories.mdi'),
  ion: $t('iconLibrary.categories.ion'),
  'antdv-next': $t('iconLibrary.categories.antdv'),
}));

const formatCount = (value: number): string => value.toLocaleString();

const getLibraryLabel = (library: SupportedIconLibrary): string => libraryLabels.value[library];

const paginationItemRender: PaginationProps['itemRender'] = (page, type, originalElement) => {
  if (type === 'page') {
    return h('span', { class: 'catalog-pagination-label' }, String(page));
  }

  return originalElement;
};

const selectCategory = (category: CategoryKey): void => {
  selectedCategory.value = category;
};

const loadIcons = async (): Promise<void> => {
  loading.value = true;
  errorMessage.value = '';

  try {
    icons.value = await loadSupportedIconCatalog();
  } catch (error: unknown) {
    console.error('Failed to load supported icon catalog:', error);
    errorMessage.value = $t('iconLibrary.loadFailed');
  } finally {
    loading.value = false;
  }
};

const copyIconName = async (name: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(name);
    message.success($t('iconLibrary.copySuccess'));
  } catch (error: unknown) {
    console.error('Failed to copy icon name:', error);
    message.error($t('iconLibrary.copyFailed'));
  }
};

watch([selectedCategory, keyword], () => {
  currentPage.value = 1;
});

watch(filteredIcons, (items) => {
  const lastPage = Math.max(1, Math.ceil(items.length / pageSize));
  if (currentPage.value > lastPage) {
    currentPage.value = lastPage;
  }
});

onMounted(() => {
  void loadIcons();
});
</script>

<style scoped lang="scss">
.icon-catalog {
  min-width: 0;
}

.catalog-header,
.catalog-results {
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--radius-lg);
  background: var(--color-bg-container);
  box-shadow: var(--shadow-card);
}

.catalog-header {
  padding: 24px;
}

.catalog-kicker {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.catalog-heading-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-top: 8px;
}

.catalog-heading {
  h1 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: 24px;
    font-weight: 700;
    line-height: 1.25;
  }

  p {
    max-width: 720px;
    margin: 8px 0 0;
    color: var(--color-text-secondary);
    font-size: 14px;
    line-height: 1.6;
  }
}

.catalog-summary {
  display: flex;
  flex-shrink: 0;
  align-items: baseline;
  gap: 6px;
  color: var(--color-text-secondary);

  strong {
    color: var(--color-primary);
    font-family: var(--font-family-number);
    font-size: 28px;
    font-weight: 700;
    line-height: 1;
  }

  span {
    font-size: 13px;
  }
}

.catalog-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
}

.category-scroll {
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: thin;
}

.category-tabs {
  display: inline-flex;
  min-width: max-content;
  gap: 4px;
  padding: 4px;
  border-radius: var(--radius-base);
  background: var(--color-bg-layout);
}

.category-tab {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 40px;
  margin: 0;
  padding: 0 12px;
  transition:
    color var(--duration-base) var(--ease-out),
    background-color var(--duration-base) var(--ease-out),
    box-shadow var(--duration-base) var(--ease-out);
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    color: var(--color-text-primary);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 1px;
  }

  &.active {
    background: var(--color-bg-container);
    color: var(--color-text-primary);
    box-shadow: var(--shadow-1);
  }
}

.category-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.category-count {
  color: var(--color-text-tertiary);
  font-family: var(--font-family-number);
  font-size: 12px;
}

.catalog-search {
  flex: 0 0 280px;
  height: 40px;
}

.catalog-results {
  margin-top: 16px;
  padding: 20px;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.icon-tile {
  display: flex;
  position: relative;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  height: 116px;
  margin: 0;
  padding: 12px 10px 10px;
  transition:
    transform var(--duration-base) var(--ease-out),
    border-color var(--duration-base) var(--ease-out),
    box-shadow var(--duration-base) var(--ease-out);
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--radius-base);
  background: var(--color-bg-container);
  color: var(--color-text-primary);
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    border-color: var(--color-primary-3);
    box-shadow: var(--shadow-1);

    .icon-tile-copy {
      opacity: 1;
    }
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
}

.icon-tile-preview {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: var(--radius-base);
  background: var(--color-bg-layout);
  color: var(--color-primary);
}

.icon-tile-name {
  width: 100%;
  margin-top: 10px;
  overflow: hidden;
  color: var(--color-text-primary);
  font-family: var(--font-family-code);
  font-size: 11px;
  line-height: 1.3;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.icon-tile-library {
  margin-top: 4px;
  color: var(--color-text-tertiary);
  font-size: 10px;
  line-height: 1.2;
  text-transform: uppercase;
}

.icon-tile-copy {
  position: absolute;
  right: 8px;
  bottom: 8px;
  color: var(--color-text-tertiary);
  font-size: 12px;
  opacity: 0;
  transition: opacity var(--duration-base) var(--ease-out);
}

.catalog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 20px;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.catalog-pagination {
  flex-shrink: 0;
}

.catalog-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 360px;
  color: var(--color-text-secondary);
  text-align: center;

  h2 {
    margin: 14px 0 4px;
    color: var(--color-text-primary);
    font-size: 16px;
    font-weight: 600;
  }

  p {
    max-width: 420px;
    margin: 0;
    font-size: 13px;
    line-height: 1.6;
  }
}

.state-icon {
  color: var(--color-text-tertiary);
  font-size: 36px;
}

.state-icon-error {
  color: var(--color-error);
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  width: 100%;
  gap: 12px;
}

.loading-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 116px;
  gap: 8px;
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--radius-base);
  background: var(--color-bg-layout);
}

.loading-icon,
.loading-line {
  display: block;
  border-radius: var(--radius-sm);
  background: var(--color-border-secondary);
  animation: icon-catalog-loading 1.2s ease-in-out infinite;
}

.loading-icon {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-base);
}

.loading-line {
  width: 42px;
  height: 8px;
}

.loading-line-wide {
  width: 82px;
}

.catalog-loading > p {
  margin: 16px 0 0;
  color: var(--color-text-secondary);
  font-size: 13px;
}

@keyframes icon-catalog-loading {
  0%,
  100% {
    opacity: 0.55;
  }

  50% {
    opacity: 1;
  }
}

@media (max-width: 900px) {
  .catalog-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .catalog-search {
    flex-basis: auto;
    width: 100%;
  }

  .loading-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .catalog-header,
  .catalog-results {
    border-radius: var(--radius-base);
  }

  .catalog-header,
  .catalog-results {
    padding: 16px;
  }

  .catalog-heading-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 14px;
  }

  .catalog-heading h1 {
    font-size: 20px;
  }

  .icon-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .icon-tile {
    height: 108px;
  }

  .catalog-footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .loading-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }
}
</style>
