import type { ApiResponse } from "@/types/api";
import type {
  OperationLog,
  OperationLogQueryParams,
} from "@/types/log";

import { request } from "@/utils/request";

/**
 * 获取操作日志列表
 */
export function getOperationLogList(
  params: OperationLogQueryParams,
): Promise<
  ApiResponse<{
    list: OperationLog[];
    total: number;
    page: number;
    pageSize: number;
  }>
> {
  return request.get("/log/operation/list", { params });
}

/**
 * 清空操作日志
 */
export function clearOperationLog(): Promise<ApiResponse<void>> {
  return request.delete("/log/operation/clear");
}
