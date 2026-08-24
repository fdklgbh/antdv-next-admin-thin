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
    path: "/examples",
    name: "Examples",
    redirect: "/examples/pro-table-advanced",
    component: () => import("@/components/Layout/AdminLayout.vue"),
    meta: {
      title: "menu.examples",
      icon: "AppstoreOutlined",
      order: 2,
    },
    children: [
      {
        path: "quick-start",
        name: "ExamplesQuickStartGroup",
        redirect: "/examples/pro-table-advanced",
        component: () => import("@/components/RouteView.vue"),
        meta: {
          title: "menu.examplesQuickStart",
          icon: "ThunderboltOutlined",
          order: 1,
        },
        children: [
          {
            path: "/examples/pro-table-advanced",
            name: "ExamplesProTableAdvanced",
            component: () =>
              import("@/views/examples/scaffold/pro-table-advanced/index.vue"),
            meta: {
              title: "menu.proTableAdvanced",
              icon: "TableOutlined",
              order: 1,
            },
          },
          {
            path: "/examples/complex-form",
            name: "ExamplesComplexForm",
            component: () =>
              import("@/views/examples/scaffold/complex-form/index.vue"),
            meta: {
              title: "menu.complexForm",
              icon: "FormOutlined",
              order: 2,
            },
          },
          {
            path: "/examples/master-detail",
            name: "ExamplesMasterDetail",
            component: () =>
              import("@/views/examples/scaffold/master-detail/index.vue"),
            meta: {
              title: "menu.masterDetail",
              icon: "ProfileOutlined",
              order: 3,
            },
          },
          {
            path: "/examples/virtual-table",
            name: "ExamplesVirtualTable",
            component: () =>
              import("@/views/examples/scaffold/virtual-table/index.vue"),
            meta: {
              title: "menu.virtualTable",
              icon: "TableOutlined",
              order: 4,
            },
          },
        ],
      },
      {
        path: "form-input",
        name: "ExamplesFormInputGroup",
        redirect: "/examples/form",
        component: () => import("@/components/RouteView.vue"),
        meta: {
          title: "menu.examplesFormInput",
          icon: "FormOutlined",
          order: 2,
        },
        children: [
          {
            path: "/examples/form",
            name: "ExamplesForm",
            component: () => import("@/views/examples/form/index.vue"),
            meta: {
              title: "menu.form",
              icon: "FormOutlined",
              order: 1,
            },
          },
          {
            path: "/examples/json-input",
            name: "ExamplesJsonInput",
            component: () => import("@/views/examples/json-input/index.vue"),
            meta: {
              title: "menu.jsonInput",
              icon: "CodeOutlined",
              order: 2,
            },
          },
          {
            path: "/examples/i18n-input",
            name: "ExamplesI18nInput",
            component: () => import("@/views/examples/i18n-input/index.vue"),
            meta: {
              title: "menu.i18nInput",
              icon: "GlobalOutlined",
              order: 3,
            },
          },
          {
            path: "/examples/advanced-filter",
            name: "ExamplesAdvancedFilter",
            component: () =>
              import("@/views/examples/scaffold/advanced-filter/index.vue"),
            meta: {
              title: "menu.advancedFilter",
              icon: "ControlOutlined",
              order: 4,
            },
          },
        ],
      },
      {
        path: "content-editors",
        name: "ExamplesContentGroup",
        redirect: "/examples/editor",
        component: () => import("@/components/RouteView.vue"),
        meta: {
          title: "menu.examplesContent",
          icon: "EditOutlined",
          order: 3,
        },
        children: [
          {
            path: "/examples/editor",
            name: "ExamplesEditor",
            component: () => import("@/views/examples/editor/index.vue"),
            meta: {
              title: "menu.editor",
              icon: "EditOutlined",
              order: 1,
            },
          },
          {
            path: "/examples/milkdown",
            name: "ExamplesMilkdown",
            component: () => import("@/views/examples/milkdown/index.vue"),
            meta: {
              title: "menu.milkdown",
              icon: "FileMarkdownOutlined",
              order: 2,
            },
          },
          {
            path: "/examples/code-editor",
            name: "ExamplesCodeEditor",
            component: () => import("@/views/examples/code-editor/index.vue"),
            meta: {
              title: "menu.codeEditor",
              icon: "CodeOutlined",
              order: 3,
            },
          },
        ],
      },
      {
        path: "basic-interaction",
        name: "ExamplesInteractionGroup",
        redirect: "/examples/table",
        component: () => import("@/components/RouteView.vue"),
        meta: {
          title: "menu.examplesInteraction",
          icon: "AppstoreAddOutlined",
          order: 4,
        },
        children: [
          {
            path: "/examples/table",
            name: "ExamplesTable",
            component: () => import("@/views/examples/table/index.vue"),
            meta: {
              title: "menu.table",
              icon: "TableOutlined",
              order: 1,
            },
          },
          {
            path: "/examples/modal",
            name: "ExamplesModal",
            component: () => import("@/views/examples/modal/index.vue"),
            meta: {
              title: "menu.modal",
              icon: "ExpandOutlined",
              order: 2,
            },
          },
          {
            path: "/examples/icon",
            name: "ExamplesIcon",
            component: () => import("@/views/examples/icon/index.vue"),
            meta: {
              title: "menu.icon",
              icon: "SmileOutlined",
              order: 3,
            },
          },
          {
            path: "/examples/spin",
            name: "ExamplesSpin",
            component: () => import("@/views/examples/spin/index.vue"),
            meta: {
              title: "menu.spin",
              icon: "LoadingOutlined",
              order: 4,
            },
          },
          {
            path: "/examples/captcha",
            name: "ExamplesCaptcha",
            component: () => import("@/views/examples/captcha/index.vue"),
            meta: {
              title: "menu.captcha",
              icon: "SafetyCertificateOutlined",
              order: 5,
            },
          },
          {
            path: "/examples/watermark",
            name: "ExamplesWatermark",
            component: () => import("@/views/examples/watermark/index.vue"),
            meta: {
              title: "menu.watermark",
              icon: "HighlightOutlined",
              order: 6,
            },
          },
          {
            path: "/examples/splitter",
            name: "ExamplesSplitter",
            component: () => import("@/views/examples/splitter/index.vue"),
            meta: {
              title: "menu.splitter",
              icon: "ColumnHeightOutlined",
              order: 7,
            },
          },
          {
            path: "/examples/tour",
            name: "ExamplesTour",
            component: () => import("@/views/examples/tour/index.vue"),
            meta: {
              title: "menu.tour",
              icon: "CompassOutlined",
              order: 8,
            },
          },
          {
            path: "/examples/qrcode",
            name: "ExamplesQRCode",
            component: () => import("@/views/examples/qrcode/index.vue"),
            meta: {
              title: "menu.qrcode",
              icon: "QrcodeOutlined",
              order: 9,
            },
          },
          {
            path: "/examples/segmented",
            name: "ExamplesSegmented",
            component: () => import("@/views/examples/segmented/index.vue"),
            meta: {
              title: "menu.segmented",
              icon: "AppstoreOutlined",
              order: 10,
            },
          },
          {
            path: "/examples/color-picker",
            name: "ExamplesColorPicker",
            component: () => import("@/views/examples/color-picker/index.vue"),
            meta: {
              title: "menu.colorPicker",
              icon: "BgColorsOutlined",
              order: 11,
            },
          },
        ],
      },
      {
        path: "business-scaffold",
        name: "ExamplesBusinessScaffoldGroup",
        redirect: "/examples/upload-system",
        component: () => import("@/components/RouteView.vue"),
        meta: {
          title: "menu.examplesBusinessScaffold",
          icon: "ProfileOutlined",
          order: 5,
        },
        children: [
          {
            path: "/examples/upload-system",
            name: "ExamplesUploadSystem",
            component: () =>
              import("@/views/examples/scaffold/upload-system/index.vue"),
            meta: {
              title: "menu.uploadSystem",
              icon: "CloudUploadOutlined",
              order: 1,
            },
          },
          {
            path: "/examples/state-cache",
            name: "ExamplesStateCache",
            component: () =>
              import("@/views/examples/scaffold/state-cache/index.vue"),
            meta: {
              title: "menu.stateCache",
              icon: "DatabaseOutlined",
              order: 2,
            },
          },
          {
            path: "/examples/import-export",
            name: "ExamplesImportExport",
            component: () =>
              import("@/views/examples/scaffold/import-export/index.vue"),
            meta: {
              title: "menu.importExport",
              icon: "FileTextOutlined",
              order: 3,
            },
          },
        ],
      },
      {
        path: "security-engineering",
        name: "ExamplesSecurityEngineeringGroup",
        redirect: "/examples/observability",
        component: () => import("@/components/RouteView.vue"),
        meta: {
          title: "menu.examplesSecurityEngineering",
          icon: "SafetyOutlined",
          order: 6,
        },
        children: [
          {
            path: "/examples/observability",
            name: "ExamplesObservability",
            component: () =>
              import("@/views/examples/scaffold/observability/index.vue"),
            meta: {
              title: "menu.observability",
              icon: "LineChartOutlined",
              order: 1,
            },
          },
          {
            path: "/examples/testing",
            name: "ExamplesTesting",
            component: () =>
              import("@/views/examples/scaffold/testing/index.vue"),
            meta: {
              title: "menu.testing",
              icon: "CheckCircleOutlined",
              order: 2,
            },
          },
        ],
      },
      {
        path: "integration-navigation",
        name: "ExamplesIntegrationGroup",
        redirect: "/examples/external/iframe/typescript",
        component: () => import("@/components/RouteView.vue"),
        meta: {
          title: "menu.examplesIntegration",
          icon: "LinkOutlined",
          order: 7,
        },
        children: [
          {
            path: "iframe",
            name: "ExamplesExternalIframe",
            redirect: "/examples/external/iframe/typescript",
            component: () => import("@/components/RouteView.vue"),
            meta: {
              title: "menu.externalIframe",
              icon: "AppstoreAddOutlined",
              order: 1,
            },
            children: [
              {
                path: "/examples/external/iframe/typescript",
                name: "ExamplesExternalIframeTypescript",
                component: () =>
                  import("@/views/examples/external/iframe/typescript.vue"),
                meta: {
                  title: "menu.externalTypescript",
                  icon: "CodeOutlined",
                  order: 1,
                },
              },
              {
                path: "/examples/external/iframe/antdv-next",
                name: "ExamplesExternalIframeAntdvNext",
                component: () =>
                  import("@/views/examples/external/iframe/antdv-next.vue"),
                meta: {
                  title: "menu.externalAntdvNext",
                  icon: "AntDesignOutlined",
                  order: 2,
                },
              },
            ],
          },
          {
            path: "link",
            name: "ExamplesExternalLink",
            component: () => import("@/components/RouteView.vue"),
            meta: {
              title: "menu.externalLink",
              icon: "LinkOutlined",
              order: 2,
            },
            children: [
              {
                path: "/examples/external/link/vite",
                name: "ExamplesExternalLinkVite",
                component: () =>
                  import("@/views/examples/external/link/vite.vue"),
                meta: {
                  title: "menu.externalVite",
                  icon: "ThunderboltOutlined",
                  externalLink: "https://vite.dev",
                  order: 1,
                },
              },
              {
                path: "/examples/external/link/vue",
                name: "ExamplesExternalLinkVue",
                component: () =>
                  import("@/views/examples/external/link/vue.vue"),
                meta: {
                  title: "menu.externalVue",
                  icon: "CoffeeOutlined",
                  externalLink: "https://vuejs.org",
                  order: 2,
                },
              },
            ],
          },
        ],
      },
      {
        path: "exception-pages",
        name: "ExamplesExceptionGroup",
        redirect: "/examples/exception/404",
        component: () => import("@/components/RouteView.vue"),
        meta: {
          title: "menu.examplesExceptionPages",
          icon: "WarningOutlined",
          order: 8,
        },
        children: [
          {
            path: "/examples/exception/404",
            name: "ExamplesException404",
            component: () => import("@/views/examples/exception/404.vue"),
            meta: {
              title: "menu.exception404",
              icon: "FileUnknownOutlined",
              order: 1,
            },
          },
          {
            path: "/examples/exception/500",
            name: "ExamplesException500",
            component: () => import("@/views/examples/exception/500.vue"),
            meta: {
              title: "menu.exception500",
              icon: "BugOutlined",
              order: 2,
            },
          },
        ],
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
