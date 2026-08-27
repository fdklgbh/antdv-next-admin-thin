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
        path: "examples/icon-library",
        name: "ExamplesIconLibrary",
        component: () => import("@/views/examples/icon-library/index.vue"),
        meta: {
          title: "menu.iconLibrary",
          icon: "AppstoreOutlined",
          order: 2,
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
