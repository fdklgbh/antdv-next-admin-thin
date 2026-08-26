<template>
  <div class="profile-page">
    <a-row :gutter="16" justify="center">
      <!-- User Info Card -->
      <a-col :xs="24" :lg="8">
        <a-card variant="borderless" class="profile-card">
          <div class="profile-header">
            <a-avatar :src="authStore.user?.avatar" :size="80" class="profile-avatar">
              {{ authStore.user?.username?.charAt(0).toUpperCase() }}
            </a-avatar>
            <h2 class="profile-name">
              {{ authStore.user?.username }}
            </h2>
            <p class="profile-username">@{{ authStore.user?.username }}</p>
          </div>

          <a-divider />

          <div class="profile-info">
            <div class="info-item">
              <span class="info-label">
                <UserOutlined class="info-icon" />
                {{ $t('profile.username') }}
              </span>
              <span class="info-value">{{ authStore.user?.username }}</span>
            </div>

            <div class="info-item">
              <span class="info-label">
                <ClockCircleOutlined class="info-icon" />
                {{ $t('profile.joinDate') }}
              </span>
              <span class="info-value">{{ formatDate(authStore.user?.createdAt) }}</span>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ClockCircleOutlined, UserOutlined } from '@antdv-next/icons';

import { $t } from '@/locales';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString();
};
</script>

<style scoped lang="scss">
.profile-page {
  .profile-card {
    .profile-header {
      text-align: center;
      padding: 16px 0;

      .profile-avatar {
        margin-bottom: 16px;
        box-shadow: var(--shadow-2);
      }

      .profile-name {
        margin: 0 0 8px;
        font-size: 20px;
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
      }

      .profile-username {
        margin: 0;
        color: var(--color-text-tertiary);
        font-size: 14px;
      }
    }

    .profile-info {
      .info-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid var(--color-border-secondary);

        &:last-child {
          border-bottom: none;
        }

        .info-label {
          display: flex;
          align-items: center;
          color: var(--color-text-secondary);
          font-size: 14px;

          .info-icon {
            margin-right: 8px;
            font-size: 16px;
            color: var(--color-primary);
          }
        }

        .info-value {
          color: var(--color-text-primary);
          font-size: 14px;
          text-align: right;
        }
      }
    }
  }

  // Mobile responsive
  @media (max-width: 992px) {
    .profile-card {
      margin-bottom: 16px;
    }
  }
}
</style>
