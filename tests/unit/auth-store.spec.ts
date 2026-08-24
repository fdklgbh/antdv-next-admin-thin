import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

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
      delete (globalThis as typeof globalThis & { localStorage?: Storage }).localStorage;
    }
  });

  it('starts with the default administrator and does not depend on local storage', () => {
    const authStore = useAuthStore();

    expect(authStore.user).toMatchObject({
      id: '1',
      username: 'admin',
      email: 'admin@example.com',
      realName: 'Administrator',
      status: 'active',
    });

    authStore.initAuth();

    expect(authStore.user).toMatchObject({
      username: 'admin',
      realName: 'Administrator',
    });
  });
});
