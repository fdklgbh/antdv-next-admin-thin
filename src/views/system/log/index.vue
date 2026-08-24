<template>
  <div class="page-container">
    <div class="log-container">
      <ProTable
        ref="operationTableRef"
        :key="'operation-' + operationRefreshKey"
        :columns="operationColumns"
        :request="loadOperationLogs"
        :toolbar="{ title: t('log.operationLog') }"
        :search="{ formItems: operationSearchFormItems }"
      >
        <template #toolbar-actions>
          <a-button danger @click="handleClearOperationLog">
            <DeleteOutlined /> {{ t("log.clearLog") }}
          </a-button>
        </template>
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a-tag :color="actionColorMap[record.action] || 'default'">
              {{ t(`log.actionTypes.${record.action}`) || record.action }}
            </a-tag>
          </template>
          <template v-if="column.key === 'status'">
            <ProStatus :value="record.status" :status-map="logStatusMap" />
          </template>
          <template v-if="column.key === 'duration'">
            <span
              :style="{
                color:
                  record.duration > 300
                    ? '#ff4d4f'
                    : record.duration > 100
                      ? '#faad14'
                      : '#52c41a',
              }"
            >
              {{ record.duration }}ms
            </span>
          </template>
        </template>
      </ProTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProFormItem, ProTableColumn, ProStatusMap } from "@/types/pro";

import { DeleteOutlined } from "@antdv-next/icons";
import { message, Modal } from "antdv-next";
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";

import {
  getOperationLogList,
  clearOperationLog,
} from "@/api/log";
import ProStatus from "@/components/Pro/ProStatus/index.vue";
import ProTable from "@/components/Pro/ProTable/index.vue";

const { t } = useI18n();

const logStatusMap = computed<ProStatusMap>(() => ({
  success: { text: t("log.success"), color: "#52c41a" },
  fail: { text: t("log.fail"), color: "#ff4d4f" },
}));

const operationRefreshKey = ref(0);

const actionColorMap: Record<string, string> = {
  create: "green",
  update: "orange",
  delete: "red",
  export: "purple",
  import: "cyan",
  other: "default",
};

// operation log search form items
const operationSearchFormItems = computed<ProFormItem[]>(() => [
  { name: "username", label: t("log.operationUser"), type: "input" },
  {
    name: "module",
    label: t("log.operationModule"),
    type: "select",
    options: [
      { label: t("log.modules.userManagement"), value: "userManagement" },
      { label: t("log.modules.dictionary"), value: "dictionary" },
      { label: t("log.modules.profile"), value: "profile" },
      { label: t("log.modules.dashboard"), value: "dashboard" },
    ],
  },
  {
    name: "action",
    label: t("log.operationType"),
    type: "select",
    options: [
      { label: t("log.actionTypes.create"), value: "create" },
      { label: t("log.actionTypes.update"), value: "update" },
      { label: t("log.actionTypes.delete"), value: "delete" },
      { label: t("log.actionTypes.export"), value: "export" },
    ],
  },
  {
    name: "status",
    label: t("common.status"),
    type: "select",
    options: [
      { label: t("log.success"), value: "success" },
      { label: t("log.fail"), value: "fail" },
    ],
  },
]);

// operation log columns
const operationColumns = computed<ProTableColumn[]>(() => [
  {
    title: t("log.operationUser"),
    dataIndex: "username",
    key: "username",
    width: 100,
  },
  {
    title: t("log.operationModule"),
    dataIndex: "module",
    key: "module",
    width: 110,
  },
  {
    title: t("log.operationType"),
    dataIndex: "action",
    key: "action",
    width: 90,
  },
  {
    title: t("log.operationDescription"),
    dataIndex: "description",
    key: "description",
    ellipsis: true,
  },
  {
    title: t("log.requestMethod"),
    dataIndex: "method",
    key: "method",
    width: 90,
  },
  {
    title: t("log.ipAddress"),
    dataIndex: "ip",
    key: "ip",
    width: 130,
  },
  {
    title: t("common.status"),
    dataIndex: "status",
    key: "status",
    width: 80,
  },
  {
    title: t("log.duration"),
    dataIndex: "duration",
    key: "duration",
    width: 80,
  },
  {
    title: t("log.operationTime"),
    dataIndex: "createTime",
    key: "createTime",
    width: 170,
  },
]);

const loadOperationLogs = async (params: Record<string, unknown>) => {
  try {
    const response = await getOperationLogList({
      username: params.username as string,
      module: params.module as string,
      action: params.action as string,
      status: params.status as string,
      page: params.current as number,
      pageSize: params.pageSize as number,
    });
    if (response.code === 200) {
      return {
        data: response.data.list,
        total: response.data.total,
        success: true,
      };
    }
  } catch (error: unknown) {
    console.error(t("log.loadOperationLogFailed"), (error as Error).message);
  }
  return { data: [], total: 0, success: false };
};

const handleClearOperationLog = () => {
  Modal.confirm({
    title: t("log.confirmClear"),
    content: t("log.confirmClearOperation"),
    okType: "danger",
    onOk: async () => {
      try {
        const response = await clearOperationLog();
        if (response.code === 200) {
          message.success(t("log.clearSuccess"));
          operationRefreshKey.value++;
        }
      } catch (_error: unknown) {
        message.error(t("log.clearFailed"));
      }
    },
  });
};

</script>

<style scoped lang="scss">
.log-container {
  background: var(--color-bg-container);
  border-radius: 8px;
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;

  :deep(.ant-table-thead > tr > th),
  :deep(.ant-table-thead > tr > td) {
    background: var(--color-fill-quaternary);
  }
}
</style>
