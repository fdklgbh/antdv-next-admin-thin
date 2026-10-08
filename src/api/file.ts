import type { ApiResponse } from '@/types/api';
import type { SysFile, SysFileQueryParams } from '@/types/file';

import { request } from '@/utils/request';

export function getFileList(params: SysFileQueryParams): Promise<
  ApiResponse<{
    list: SysFile[];
    total: number;
    page: number;
    pageSize: number;
  }>
> {
  return request.get('/file/list', { params });
}

export function deleteFile(id: string): Promise<ApiResponse<void>> {
  return request.delete(`/file/${id}`);
}

export function uploadFile(file: File): Promise<ApiResponse<SysFile>> {
  const data = new FormData();
  data.append('file', file);
  return request.post('/file/upload', data, { headers: { 'Content-Type': undefined } });
}

export function downloadFile(id: string): Promise<Blob> {
  return request.get(`/file/${id}/download`, { responseType: 'blob' });
}
