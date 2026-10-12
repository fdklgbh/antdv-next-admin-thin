import { describe, expect, it } from 'vitest';

import { resolvePermissionNodeTitle } from '@/views/system/role/permissionSelection';

describe('resolvePermissionNodeTitle', () => {
  it('returns the title when it is a non-empty string', () => {
    expect(resolvePermissionNodeTitle({ value: '11', title: '系统管理' })).toBe('系统管理');
  });

  it('stringifies a numeric title', () => {
    expect(resolvePermissionNodeTitle({ value: '11', title: 0 })).toBe('0');
  });

  it('falls back to the value when the title is undefined', () => {
    expect(resolvePermissionNodeTitle({ value: 'missing-id', title: undefined })).toBe('missing-id');
  });

  it('falls back to the value when the title is null', () => {
    expect(resolvePermissionNodeTitle({ value: 'missing-id', title: null })).toBe('missing-id');
  });

  it('falls back to the value when the title is an empty string', () => {
    expect(resolvePermissionNodeTitle({ value: 'missing-id', title: '' })).toBe('missing-id');
  });

  it('falls back to the value when the title is a boolean', () => {
    expect(resolvePermissionNodeTitle({ value: 'missing-id', title: true })).toBe('missing-id');
  });

  it('falls back to the stringified value for numeric values', () => {
    expect(resolvePermissionNodeTitle({ value: 99, title: undefined })).toBe('99');
  });

  it('returns an empty string when both value and title are missing', () => {
    expect(resolvePermissionNodeTitle({})).toBe('');
    expect(resolvePermissionNodeTitle({ value: undefined, title: undefined })).toBe('');
  });

  it('returns an empty string when the whole node is undefined or null', () => {
    // rc-tree 对部分渲染路径可能以 undefined/null 调用 titleRender。
    expect(resolvePermissionNodeTitle(undefined)).toBe('');
    expect(resolvePermissionNodeTitle(null)).toBe('');
  });
});
