import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/stores/auth';

describe('auth store without authentication', () => {
  let originalLocalStorage: PropertyDescriptor | undefined;

  beforeEach(() => {
    originalLocalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: vi.fn(() => {
          throw new Error('localStorage should not be accessed');
        }),
      },
    });
    setActivePinia(createPinia());
  });

  afterEach(() => {
    if (originalLocalStorage) {
      Object.defineProperty(globalThis, 'localStorage', originalLocalStorage);
    } else {
      // @ts-ignore
      delete (globalThis as typeof globalThis & { localStorage?: Storage }).localStorage;
    }
  });

  it('starts with the default administrator and does not depend on local storage', () => {
    const authStore = useAuthStore();

    expect(authStore.user).toEqual({
      username: 'admin',
      avatar: expect.any(String),
      createdAt: '2023-01-01T00:00:00.000Z',
    });

    authStore.initAuth();

    expect(authStore.user).toEqual({
      username: 'admin',
      avatar: expect.any(String),
      createdAt: '2023-01-01T00:00:00.000Z',
    });
  });
});
