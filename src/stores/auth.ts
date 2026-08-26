import type { User } from '@/types/auth';

import { defineStore } from 'pinia';
import { ref } from 'vue';

import avatarImg from '@/assets/images/avatar-256.png';

const DEFAULT_USER: User = {
  username: 'admin',
  avatar: avatarImg,
  createdAt: '2023-01-01T00:00:00.000Z',
};

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User>({ ...DEFAULT_USER });

  const setUserInfo = (userInfo: User | null): void => {
    user.value = userInfo
      ? {
          username: userInfo.username,
          avatar: userInfo.avatar,
          createdAt: userInfo.createdAt,
        }
      : { ...DEFAULT_USER };
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
