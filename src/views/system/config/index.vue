<template>
  <div class="page-container">
    <ProSplitLayout :side-width="200">
      <template #side>
        <!-- groups nav -->
        <div class="config-groups-header">
          <h3>{{ $t('config.configGroups') }}</h3>
        </div>
        <a-menu
          v-model:selectedKeys="selectedMenuKeys"
          :key="i18nLocale"
          mode="inline"
          :items="menuItems"
          class="config-groups-menu"
          @click="handleMenuClick"
        />
      </template>

      <template #main>
        <!-- config list -->
        <ProTable
          :key="selectedGroup + refreshKey"
          :columns="columns"
          :request="loadConfigList"
          :search="false"
          :toolbar="{ title: getGroupLabel(selectedGroup) }"
        >
          <template #toolbar-actions>
            <a-button v-permission="'system.config.create'" type="primary" @click="handleAdd">
              <PlusOutlined /> {{ $t('config.createConfig') }}
            </a-button>
          </template>
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'value'">
              <template v-if="record.valueType === 'boolean'">
                <a-tag :color="record.value === 'true' ? 'green' : 'default'">
                  {{ record.value === 'true' ? $t('common.yes') : $t('common.no') }}
                </a-tag>
              </template>
              <template v-else>
                <span class="config-value">{{ record.value }}</span>
              </template>
            </template>
            <template v-if="column.key === 'valueType'">
              <a-tag>{{ $t(`config.valueTypes.${record.valueType}`) || record.valueType }}</a-tag>
            </template>
            <template v-if="column.key === 'builtIn'">
              <a-tag :color="record.builtIn ? 'blue' : 'default'">
                {{
                  record.builtIn
                    ? $t('config.builtInTypes.builtIn')
                    : $t('config.builtInTypes.custom')
                }}
              </a-tag>
            </template>
            <template v-if="column.key === 'action'">
              <a-space :size="4">
                <a-button
                  v-permission="'system.config.edit'"
                  type="link"
                  size="small"
                  @click="handleEdit(record)"
                >
                  <template #icon><EditOutlined /></template>
                  {{ $t('common.edit') }}
                </a-button>
                <a-button
                  v-if="!record.builtIn"
                  v-permission="'system.config.delete'"
                  type="link"
                  size="small"
                  danger
                  @click="handleDelete(record)"
                >
                  <template #icon><DeleteOutlined /></template>
                  {{ $t('common.delete') }}
                </a-button>
              </a-space>
            </template>
          </template>
        </ProTable>
      </template>
    </ProSplitLayout>

    <!-- add/edit modal -->
    <a-modal v-model:open="modalVisible" :title="modalTitle" @ok="handleSubmit" :width="520">
      <a-form :model="form" :label-col="{ span: 6 }" style="margin-top: 16px">
        <a-form-item :label="$t('config.configName')" required>
          <a-input v-model:value="form.name" :placeholder="$t('config.placeholders.configName')" />
        </a-form-item>
        <a-form-item :label="$t('config.configKey')" required>
          <a-input
            v-model:value="form.key"
            :placeholder="$t('config.placeholders.configKey')"
            :disabled="!!form.id"
          />
        </a-form-item>
        <a-form-item :label="$t('config.configValue')" required>
          <a-switch v-if="form.valueType === 'boolean'" v-model:checked="boolValue" />
          <a-input-number
            v-else-if="form.valueType === 'number'"
            v-model:value="form.value"
            style="width: 100%"
          />
          <a-textarea
            v-else-if="form.valueType === 'json'"
            v-model:value="form.value"
            :rows="4"
            :placeholder="$t('config.placeholders.jsonFormat')"
          />
          <a-input
            v-else
            v-model:value="form.value"
            :placeholder="$t('config.placeholders.configValue')"
          />
        </a-form-item>
        <a-form-item :label="$t('config.valueType')">
          <a-select
            v-model:value="form.valueType"
            :disabled="!!form.id"
            :options="valueTypeOptions"
          />
        </a-form-item>
        <a-form-item :label="$t('config.group')">
          <a-auto-complete
            v-model:value="form.group"
            :options="groupOptions"
            :placeholder="$t('config.placeholders.group')"
            allow-clear
          />
        </a-form-item>
        <a-form-item :label="$t('config.sort')">
          <a-input-number v-model:value="form.sort" :min="0" style="width: 100%" />
        </a-form-item>
        <a-form-item :label="$t('config.description')">
          <a-textarea
            v-model:value="form.description"
            :placeholder="$t('config.placeholders.description')"
            :rows="2"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import type { SysConfig, SysConfigGroup } from '@/types/config';
import type { ProTableColumn } from '@/types/pro';
import type { MenuItemType } from 'antdv-next';

import { EditOutlined, DeleteOutlined, PlusOutlined } from '@antdv-next/icons';
import { message, Modal } from 'antdv-next';
import { ref, computed, h } from 'vue';
import { useI18n } from 'vue-i18n';

import {
  getConfigList,
  getConfigGroups,
  createConfig,
  updateConfig,
  deleteConfig,
} from '@/api/config';
import ProSplitLayout from '@/components/Pro/ProSplitLayout/index.vue';
import ProTable from '@/components/Pro/ProTable/index.vue';
import { showApiError, resolveApiError } from '@/utils/apiError';

const { t, locale } = useI18n();

const groups = ref<SysConfigGroup[]>([]);
const selectedGroup = ref('');
const refreshKey = ref(0);
const i18nLocale = computed(() => locale.value);
const valueTypeOptions = computed(() =>
  ['string', 'number', 'boolean', 'json'].map((value) => ({
    label: t(`config.valueTypes.${value}`),
    value,
  })),
);
const groupOptions = computed(() =>
  groups.value.map((item) => ({
    label: getGroupLabel(item.group),
    value: item.group,
  })),
);
const selectedMenuKeys = computed({
  get: () => [selectedGroup.value],
  set: (keys: string[]) => {
    if (keys.length > 0) selectGroup(keys[0]);
  },
});

function getGroupLabel(group: string) {
  if (!group) return '';
  const item = groups.value.find((candidate) => candidate.group === group);
  return item?.name || group;
}

function selectGroup(group: string) {
  if (!group) return;
  selectedGroup.value = group;
}

const menuItems = computed<MenuItemType[]>(() =>
  groups.value.map((item) => ({
    key: item.group,
    label: h('div', { class: 'menu-item-label' }, [
      h('span', { class: 'group-name' }, getGroupLabel(item.group)),
      h('span', { class: 'group-count' }, String(item.count)),
    ]),
    title: getGroupLabel(item.group),
  })),
);

const handleMenuClick = ({ key }: { key: string }) => {
  selectGroup(key);
};

// modal
const modalVisible = ref(false);
const modalTitle = computed(() =>
  form.value.id ? t('config.editConfig') : t('config.createConfig'),
);
const form = ref<Partial<SysConfig>>({
  name: '',
  key: '',
  value: '',
  valueType: 'string',
  group: 'basic',
  sort: 0,
  description: '',
});
const boolValue = computed({
  get: () => form.value.value === 'true',
  set: (v: boolean) => {
    form.value.value = String(v);
  },
});

const columns: ProTableColumn[] = [
  { title: t('config.configName'), dataIndex: 'name', key: 'name', width: 160 },
  { title: t('config.configKey'), dataIndex: 'key', key: 'key', width: 200 },
  {
    title: t('config.configValue'),
    dataIndex: 'value',
    key: 'value',
    ellipsis: true,
  },
  {
    title: t('config.valueType'),
    dataIndex: 'valueType',
    key: 'valueType',
    width: 90,
  },
  {
    title: t('config.builtIn'),
    dataIndex: 'builtIn',
    key: 'builtIn',
    width: 90,
  },
  {
    title: t('config.description'),
    dataIndex: 'description',
    key: 'description',
    ellipsis: true,
  },
  {
    title: t('common.actions'),
    dataIndex: 'action',
    key: 'action',
    width: 150,
    fixed: 'right',
  },
];

const loadConfigList = async (params: Record<string, unknown>) => {
  if (!selectedGroup.value) return { data: [], total: 0, success: true };
  try {
    const response = await getConfigList({
      group: selectedGroup.value,
      page: params.current as number,
      pageSize: params.pageSize as number,
    });
    if (response.code === 0 || response.code === 200) {
      return {
        data: response.data.list,
        total: response.data.total,
        success: true,
      };
    }
  } catch (error: unknown) {
    console.error(t('config.loadConfigFailed'), (error as Error).message);
  }
  return { data: [], total: 0, success: false };
};

const loadConfigGroups = async (preferredGroup?: string) => {
  try {
    const response = await getConfigGroups();
    if (response.code !== 0 && response.code !== 200) return;
    groups.value = response.data;
    const nextGroup =
      preferredGroup && response.data.some((item) => item.group === preferredGroup)
        ? preferredGroup
        : selectedGroup.value && response.data.some((item) => item.group === selectedGroup.value)
          ? selectedGroup.value
          : (response.data[0]?.group ?? '');
    if (nextGroup === selectedGroup.value) {
      refreshKey.value++;
      return;
    }
    selectedGroup.value = nextGroup;
  } catch (error: unknown) {
    showApiError(error, t('config.loadConfigFailed'));
  }
};

const handleAdd = () => {
  form.value = {
    name: '',
    key: '',
    value: '',
    valueType: 'string',
    group: selectedGroup.value,
    sort: 0,
    description: '',
  };
  modalVisible.value = true;
};

const handleEdit = (record: SysConfig) => {
  form.value = { ...record };
  modalVisible.value = true;
};

const handleDelete = (record: SysConfig) => {
  Modal.confirm({
    title: t('config.confirmDelete'),
    content: t('config.confirmDeleteContent', { name: record.name }),
    onOk: async () => {
      try {
        const response = await deleteConfig(record.id);
        if (response.code === 0 || response.code === 200) {
          message.success(t('config.deleteSuccess'));
          refreshKey.value++;
          loadConfigGroups();
        } else {
          message.error(resolveApiError(response, t('config.deleteFailed')));
        }
      } catch (error: unknown) {
        showApiError(error, t('config.deleteFailed'));
      }
    },
  });
};

const handleSubmit = async () => {
  if (!form.value.name || !form.value.key) {
    message.warning(t('config.requiredFields'));
    return;
  }
  try {
    if (form.value.id) {
      const response = await updateConfig(form.value.id, {
        ...form.value,
        value: String(form.value.value ?? ''),
      });
      if (response.code === 0 || response.code === 200) {
        message.success(t('config.updateSuccess'));
        modalVisible.value = false;
        refreshKey.value++;
        loadConfigGroups();
      }
    } else {
      const response = await createConfig({ ...form.value, value: String(form.value.value ?? '') });
      if (response.code === 0 || response.code === 200) {
        message.success(t('config.createSuccess'));
        modalVisible.value = false;
        loadConfigGroups(form.value.group);
      } else {
        message.error(resolveApiError(response, t('config.operateFailed')));
      }
    }
  } catch (error: unknown) {
    showApiError(error, t('config.operateFailed'));
  }
};

loadConfigGroups();
</script>

<style scoped lang="scss">
.page-container {
  display: flex;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

.config-groups-header {
  padding: 0 16px;
  margin-bottom: 8px;

  h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-heading);
  }
}

.config-groups-menu {
  flex: 1;
  overflow: auto;
  background: transparent;
  border: none;

  :deep(.ant-menu-item) {
    margin: 4px 8px;
    padding: 10px 12px !important;
    border-radius: 8px;
    height: auto;
    transition: all 0.2s;

    &::before {
      // Remove default selected indicator
      display: none;
    }

    &:hover {
      background: var(--color-fill-quaternary, #fafafa);
    }

    &.ant-menu-item-selected {
      background: color-mix(in srgb, var(--color-primary) 8%, transparent);

      .group-name {
        color: var(--color-primary);
        font-weight: 600;
      }
    }
  }

  .menu-item-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;

    .group-name {
      font-size: 14px;
      flex: 1;
    }

    .group-count {
      font-size: 12px;
      color: var(--color-text-quaternary);
      background: var(--color-fill-quaternary);
      padding: 0 8px;
      border-radius: 10px;
      line-height: 20px;
      margin-left: 8px;
      flex-shrink: 0;
    }
  }
}
</style>
