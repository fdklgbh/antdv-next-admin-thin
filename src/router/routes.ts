import type { AppRouteRecordRaw } from '@/types/router';

import { PERMISSIONS } from '@/constants/permissions';

/**
 * Static routes that don't require authentication
 */
export const staticRoutes: AppRouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: {
      title: 'login.title',
      requiresAuth: false,
      hidden: true,
    },
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: {
      title: 'error.404',
      requiresAuth: false,
      hidden: true,
    },
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/error/403.vue'),
    meta: {
      title: 'error.403',
      requiresAuth: false,
      hidden: true,
    },
  },
  {
    path: '/500',
    name: 'ServerError',
    component: () => import('@/views/error/500.vue'),
    meta: {
      title: 'error.500',
      requiresAuth: false,
      hidden: true,
    },
  },
];

/**
 * Basic routes that require authentication
 */
export const basicRoutes: AppRouteRecordRaw[] = [
  {
    path: '/',
    name: 'Root',
    redirect: '/dashboard',
    component: () => import('@/components/Layout/AdminLayout.vue'),
    meta: {
      title: 'Dashboard',
      requiresAuth: true,
    },
    children: [
      {
        path: '/redirect/:path(.*)',
        name: 'Redirect',
        component: () => import('@/views/redirect/index.vue'),
        meta: {
          title: 'Redirect',
          hidden: true,
        },
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: {
          title: 'menu.dashboard',
          icon: 'DashboardOutlined',
          requiresAuth: true,
          affix: true,
          order: 1,
        },
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/profile/index.vue'),
        meta: {
          title: 'menu.profile',
          icon: 'UserOutlined',
          requiresAuth: true,
          hidden: true,
        },
      },
      {
        path: 'notifications',
        name: 'Notifications',
        component: () => import('@/views/notification/index.vue'),
        meta: {
          title: 'layout.notifications',
          icon: 'BellOutlined',
          requiresAuth: true,
          hidden: true,
        },
      },
      {
        path: 'about',
        name: 'About',
        component: () => import('@/views/about/index.vue'),
        meta: {
          title: 'menu.about',
          icon: 'InfoCircleOutlined',
          requiresAuth: true,
          order: 5,
        },
      },
    ],
  },
];

/**
 * Async routes that require permission checking
 */
export const asyncRoutes: AppRouteRecordRaw[] = [
  {
    path: '/organization',
    name: 'Organization',
    redirect: '/organization/user',
    component: () => import('@/components/Layout/AdminLayout.vue'),
    meta: {
      title: 'menu.organization',
      icon: 'TeamOutlined',
      requiresAuth: true,
      order: 3,
    },
    children: [
      {
        path: 'user',
        name: 'OrganizationUser',
        component: () => import('@/views/system/user/index.vue'),
        meta: {
          title: 'menu.user',
          icon: 'UserOutlined',
          requiresAuth: true,
          requiredPermissions: [PERMISSIONS.SYSTEM_USER_VIEW],
        },
      },
      {
        path: 'role',
        name: 'OrganizationRole',
        component: () => import('@/views/system/role/index.vue'),
        meta: {
          title: 'menu.role',
          icon: 'TeamOutlined',
          requiresAuth: true,
          requiredPermissions: [PERMISSIONS.SYSTEM_ROLE_VIEW],
        },
      },
      {
        path: 'permission',
        name: 'OrganizationPermission',
        component: () => import('@/views/system/permission/index.vue'),
        meta: {
          title: 'menu.permission',
          icon: 'SafetyOutlined',
          requiresAuth: true,
          requiredPermissions: [PERMISSIONS.SYSTEM_PERMISSION_VIEW],
        },
      },
    ],
  },
  {
    path: '/system',
    name: 'System',
    redirect: '/system/config',
    component: () => import('@/components/Layout/AdminLayout.vue'),
    meta: {
      title: 'menu.system',
      icon: 'SettingOutlined',
      requiresAuth: true,
      order: 4,
    },
    children: [
      {
        path: 'config',
        name: 'SystemConfig',
        component: () => import('@/views/system/config/index.vue'),
        meta: {
          title: 'menu.config',
          icon: 'ControlOutlined',
          requiresAuth: true,
          requiredPermissions: [PERMISSIONS.SYSTEM_CONFIG_VIEW],
        },
      },
      {
        path: 'dict',
        name: 'SystemDict',
        component: () => import('@/views/system/dict/index.vue'),
        meta: {
          title: 'menu.dict',
          icon: 'BookOutlined',
          requiresAuth: true,
          requiredPermissions: [PERMISSIONS.SYSTEM_DICT_VIEW],
        },
      },
      {
        path: 'file',
        name: 'SystemFile',
        component: () => import('@/views/system/file/index.vue'),
        meta: {
          title: 'menu.file',
          icon: 'FolderOutlined',
          requiresAuth: true,
          requiredPermissions: [PERMISSIONS.SYSTEM_FILE_VIEW],
        },
      },
      {
        path: 'log',
        name: 'SystemLog',
        component: () => import('@/views/system/log/index.vue'),
        meta: {
          title: 'menu.log',
          icon: 'FileTextOutlined',
          requiresAuth: true,
          requiredPermissions: [PERMISSIONS.SYSTEM_LOG_VIEW],
        },
      },
    ],
  },
];

/**
 * Catch-all route
 */
export const notFoundRoute: AppRouteRecordRaw = {
  path: '/:pathMatch(.*)*',
  name: 'NotFoundCatchAll',
  component: () => import('@/views/error/404.vue'),
  meta: {
    title: 'error.404',
    requiresAuth: false,
    hidden: true,
  },
};
