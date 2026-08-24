/**
 * 操作日志
 */
export interface OperationLog {
  id: string;
  /** 操作用户 */
  username: string;
  /** 操作模块 */
  module: string;
  /** 操作类型 */
  action: 'create' | 'update' | 'delete' | 'export' | 'import' | 'other';
  /** 操作描述 */
  description: string;
  /** 请求方法 */
  method: string;
  /** 请求路径 */
  url: string;
  /** 请求IP */
  ip: string;
  /** 浏览器 */
  browser: string;
  /** 操作系统 */
  os: string;
  /** 操作状态 */
  status: 'success' | 'fail';
  /** 错误信息 */
  errorMsg?: string;
  /** 耗时(ms) */
  duration: number;
  /** 操作时间 */
  createTime: string;
}

/**
 * 操作日志查询参数
 */
export interface OperationLogQueryParams {
  username?: string;
  module?: string;
  action?: string;
  status?: string;
  startTime?: string;
  endTime?: string;
  page?: number;
  pageSize?: number;
}
