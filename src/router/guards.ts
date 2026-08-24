import type { MenuHistoryItem } from '@/types/navigation';
import type { AppRouteRecordRaw } from '@/types/router';
import type { Router, RouteLocationNormalized } from 'vue-router';

import { useDictStore } from '@/stores/dict';
import { useTabsStore } from '@/stores/tabs';
import { resolveLocaleText } from '@/utils/i18n';
import { normalizeMenuHistoryItems } from '@/utils/menuPreferences';

import { basicRoutes } from './routes';

const MENU_HISTORY_KEY = 'app-menu-history';
const MAX_HISTORY_ITEMS = 10;

function setDocumentTitle(route: RouteLocationNormalized): void {
  if (!route.meta.title) return;

  const title = resolveLocaleText(
    route.meta.title as string,
    String(route.name || route.path || 'Dashboard'),
  );
  document.title = `${title} - ${import.meta.env.VITE_APP_TITLE || 'Antdv Next Admin'}`;
}

function getApplicationRoutes(): AppRouteRecordRaw[] {
  return basicRoutes;
}

function initTabsIfNeeded(tabsStore: ReturnType<typeof useTabsStore>): void {
  if (tabsStore.tabs.length > 0) return;

  const routeSources = getApplicationRoutes();
  tabsStore.restoreTabsState(routeSources);

  if (tabsStore.tabs.length === 0) {
    tabsStore.initAffixTabs(routeSources);
  }
}

function shouldAddTab(route: RouteLocationNormalized): boolean {
  return Boolean(route.name && !route.meta.hidden);
}

function recordMenuHistory(route: RouteLocationNormalized): void {
  let history: MenuHistoryItem[] = [];
  try {
    const persistedHistory: unknown = JSON.parse(localStorage.getItem(MENU_HISTORY_KEY) || '[]');
    history = normalizeMenuHistoryItems(persistedHistory);
  } catch {
    // Replace malformed persisted history with the current valid navigation below.
  }

  const title = resolveLocaleText(route.meta?.title as string, String(route.name || route.path));
  const filtered = history.filter((item) => item.path !== route.path);

  filtered.unshift({
    path: route.path,
    title,
    icon: route.meta?.icon as string,
    timestamp: Date.now(),
  });

  try {
    localStorage.setItem(MENU_HISTORY_KEY, JSON.stringify(filtered.slice(0, MAX_HISTORY_ITEMS)));
  } catch {
    // History persistence is optional when storage is unavailable.
  }
}

/**
 * Setup router behavior that is independent of user state.
 */
export function setupRouterGuards(router: Router): void {
  router.beforeEach((to) => {
    const tabsStore = useTabsStore();

    setDocumentTitle(to);
    initTabsIfNeeded(tabsStore);
    void useDictStore().loadDictData();

    if (shouldAddTab(to)) {
      tabsStore.addTab(to);
    }
  });

  router.afterEach((to) => {
    window.scrollTo(0, 0);

    const tabsStore = useTabsStore();
    if (to.path) {
      tabsStore.setActiveTab(to.path);
    }

    if (shouldAddTab(to)) {
      recordMenuHistory(to);
    }
  });

  router.onError((error) => {
    console.error('Router error:', error);
  });
}
