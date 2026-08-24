import type { User } from '@/types/auth';

import { defineStore } from 'pinia';
import { ref } from 'vue';

import avatarImg from '@/assets/images/avatar-256.png';

const DEFAULT_USER: User = {
  id: '1',
  username: 'admin',
  email: 'admin@example.com',
  realName: 'Administrator',
  avatar: avatarImg,
  phone: '13800138000',
  gender: 'male',
  birthDate: '1990-01-01',
  bio: 'System Administrator',
  status: 'active',
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
};

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User>({ ...DEFAULT_USER });

  const setUserInfo = (userInfo: User | null): void => {
    user.value = userInfo ? { ...userInfo } : { ...DEFAULT_USER };
  };

  const initAuth = (): void => {
    user.value = { ...DEFAULT_USER };
  };

  return {
    user,
    setUserInfo,
    initAuth,
  };
});
