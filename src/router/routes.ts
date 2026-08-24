import type { AppRouteRecordRaw } from "@/types/router";

/**
 * Static routes available without application state.
 */
export const staticRoutes: AppRouteRecordRaw[] = [
  {
    path: "/404",
    name: "NotFound",
    component: () => import("@/views/error/404.vue"),
    meta: {
      title: "error.404",
      hidden: true,
    },
  },
  {
    path: "/500",
    name: "ServerError",
    component: () => import("@/views/error/500.vue"),
    meta: {
      title: "error.500",
      hidden: true,
    },
  },
];

/**
 * Core application routes.
 */
export const basicRoutes: AppRouteRecordRaw[] = [
  {
    path: "/",
    name: "Root",
    redirect: "/dashboard",
    component: () => import("@/components/Layout/AdminLayout.vue"),
    meta: {
      title: "Dashboard",
    },
    children: [
      {
        path: "/redirect/:path(.*)",
        name: "Redirect",
        component: () => import("@/views/redirect/index.vue"),
        meta: {
          title: "Redirect",
          hidden: true,
        },
      },
      {
        path: "dashboard",
        name: "Dashboard",
        component: () => import("@/views/dashboard/index.vue"),
        meta: {
          title: "menu.dashboard",
          icon: "DashboardOutlined",
          affix: true,
          order: 1,
        },
      },
      {
        path: "profile",
        name: "Profile",
        component: () => import("@/views/profile/index.vue"),
        meta: {
          title: "menu.profile",
          icon: "UserOutlined",
          hidden: true,
        },
      },
      {
        path: "notifications",
        name: "Notifications",
        component: () => import("@/views/notification/index.vue"),
        meta: {
          title: "layout.notifications",
          icon: "BellOutlined",
          hidden: true,
        },
      },
      {
        path: "about",
        name: "About",
        component: () => import("@/views/about/index.vue"),
        meta: {
          title: "menu.about",
          icon: "InfoCircleOutlined",
          order: 5,
        },
      },
    ],
  },
  {
    path: "/organization",
    name: "Organization",
    redirect: "/organization/user",
    component: () => import("@/components/Layout/AdminLayout.vue"),
    meta: {
      title: "menu.organization",
      icon: "TeamOutlined",
      order: 3,
    },
    children: [
      {
        path: "user",
        name: "OrganizationUser",
        component: () => import("@/views/system/user/index.vue"),
        meta: {
          title: "menu.user",
          icon: "UserOutlined",
        },
      },
    ],
  },
  {
    path: "/system",
    name: "System",
    redirect: "/system/config",
    component: () => import("@/components/Layout/AdminLayout.vue"),
    meta: {
      title: "menu.system",
      icon: "SettingOutlined",
      order: 4,
    },
    children: [
      {
        path: "config",
        name: "SystemConfig",
        component: () => import("@/views/system/config/index.vue"),
        meta: {
          title: "menu.config",
          icon: "ControlOutlined",
        },
      },
      {
        path: "dict",
        name: "SystemDict",
        component: () => import("@/views/system/dict/index.vue"),
        meta: {
          title: "menu.dict",
          icon: "BookOutlined",
        },
      },
      {
        path: "file",
        name: "SystemFile",
        component: () => import("@/views/system/file/index.vue"),
        meta: {
          title: "menu.file",
          icon: "FolderOutlined",
        },
      },
      {
        path: "log",
        name: "SystemLog",
        component: () => import("@/views/system/log/index.vue"),
        meta: {
          title: "menu.log",
          icon: "FileTextOutlined",
        },
      },
    ],
  },
  {
    path: "/exception",
    name: "Exception",
    redirect: "/exception/404",
    component: () => import("@/components/Layout/AdminLayout.vue"),
    meta: {
      title: "menu.exception",
      icon: "WarningOutlined",
      order: 2,
    },
    children: [
      {
        path: "404",
        name: "Exception404",
        component: () => import("@/views/exception/404.vue"),
        meta: {
          title: "menu.exception404",
          icon: "FileUnknownOutlined",
          order: 1,
        },
      },
      {
        path: "500",
        name: "Exception500",
        component: () => import("@/views/exception/500.vue"),
        meta: {
          title: "menu.exception500",
          icon: "BugOutlined",
          order: 2,
        },
      },
    ],
  },
];

/**
 * Catch-all route
 */
export const notFoundRoute: AppRouteRecordRaw = {
  path: "/:pathMatch(.*)*",
  name: "NotFoundCatchAll",
  component: () => import("@/views/error/404.vue"),
  meta: {
    title: "error.404",
    hidden: true,
  },
};
