import type { ApiResponse, PageParams, PageResult } from '@/types/api';
import type { Role } from '@/types/auth';

import { request } from '@/utils/request';

/**
 * Get role list
 */
export function getRoleList(params: PageParams): Promise<ApiResponse<PageResult<Role>>> {
  return request.get('/roles', { params });
}

/**
 * Get role by ID
 */
export function getRoleOptions(): Promise<ApiResponse<PageResult<Role>>> {
  const mock = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';
  return request.get(mock ? '/roles' : '/roles/options', { params: { current: 1, pageSize: 10000 } });
}

export function getRoleById(id: string): Promise<ApiResponse<Role>> {
  return request.get(`/roles/${id}`);
}

/**
 * Create role
 */
export function createRole(data: Partial<Role>): Promise<ApiResponse<Role>> {
  return request.post('/roles', data);
}

/**
 * Update role
 */
export function updateRole(id: string, data: Partial<Role>): Promise<ApiResponse<Role>> {
  return request.put(`/roles/${id}`, data);
}

/**
 * Delete role
 */
export function deleteRole(id: string): Promise<ApiResponse<null>> {
  return request.delete(`/roles/${id}`);
}
